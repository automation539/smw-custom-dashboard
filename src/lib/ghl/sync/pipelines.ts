import { createServiceClient } from "@/lib/supabase/service";
import { createGhlClient } from "@/lib/ghl/client";

interface ExtractedStage {
  id: string;
  name: string | null;
  position: number | null;
}

// GHL's own published spec can't determine the shape of a pipeline's
// `stages` entries (documented as a generic array of arrays), so this
// parses defensively rather than assuming a confirmed shape.
function extractStages(rawStages: unknown): ExtractedStage[] {
  if (!Array.isArray(rawStages)) {
    return [];
  }

  return rawStages
    .map((stage, index): ExtractedStage | null => {
      if (!stage || typeof stage !== "object") {
        return null;
      }
      const s = stage as Record<string, unknown>;
      const id = typeof s.id === "string" ? s.id : null;
      if (!id) {
        return null;
      }
      return {
        id,
        name: typeof s.name === "string" ? s.name : null,
        position: typeof s.position === "number" ? s.position : index,
      };
    })
    .filter((stage): stage is ExtractedStage => stage !== null);
}

export async function syncGhlPipelines(clientId: string): Promise<{ recordsSynced: number }> {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from("ghl_connections")
    .select("location_id")
    .eq("client_id", clientId)
    .single();

  if (!connection) {
    throw new Error("No GHL connection found for this client");
  }

  const { data: token } = await supabase.rpc("get_ghl_token", { p_client_id: clientId });

  if (!token) {
    throw new Error("No GHL token found for this client");
  }

  const client = createGhlClient({ locationId: connection.location_id, privateToken: token });
  const pipelines = await client.listPipelines();

  let recordsSynced = 0;

  for (const pipeline of pipelines) {
    const { data: pipelineRow, error: pipelineError } = await supabase
      .from("ghl_pipelines")
      .upsert(
        {
          client_id: clientId,
          ghl_pipeline_id: pipeline.id,
          name: pipeline.name ?? "Untitled pipeline",
          raw: pipeline as unknown as Record<string, unknown>,
        },
        { onConflict: "client_id,ghl_pipeline_id" }
      )
      .select("id")
      .single();

    if (pipelineError || !pipelineRow) {
      throw new Error(
        `Failed to upsert GHL pipeline ${pipeline.id}: ${pipelineError?.message ?? "unknown error"}`
      );
    }

    recordsSynced++;

    for (const stage of extractStages(pipeline.stages)) {
      const { error: stageError } = await supabase.from("ghl_pipeline_stages").upsert(
        {
          client_id: clientId,
          pipeline_id: pipelineRow.id,
          ghl_stage_id: stage.id,
          name: stage.name ?? "Untitled stage",
          position: stage.position,
          raw: stage as unknown as Record<string, unknown>,
        },
        { onConflict: "client_id,ghl_stage_id" }
      );

      if (stageError) {
        throw new Error(`Failed to upsert GHL pipeline stage ${stage.id}: ${stageError.message}`);
      }

      recordsSynced++;
    }
  }

  return { recordsSynced };
}
