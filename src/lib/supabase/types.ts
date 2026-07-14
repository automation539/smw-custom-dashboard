export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          owner_id: string;
          company_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          company_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          company_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ghl_connections: {
        Row: {
          id: string;
          client_id: string;
          location_id: string;
          token_secret_id: string;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          location_id: string;
          token_secret_id: string;
          connected_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          location_id?: string;
          token_secret_id?: string;
          connected_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ghl_users: {
        Row: {
          id: string;
          client_id: string;
          ghl_user_id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          role: string | null;
          permissions: Record<string, unknown>;
          raw: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          ghl_user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          permissions?: Record<string, unknown>;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          ghl_user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          permissions?: Record<string, unknown>;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ghl_contacts: {
        Row: {
          id: string;
          client_id: string;
          ghl_contact_id: string;
          assigned_to: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          source: string | null;
          tags: string[];
          status: string;
          first_contacted_at: string | null;
          raw: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          ghl_contact_id: string;
          assigned_to?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          tags?: string[];
          status?: string;
          first_contacted_at?: string | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          ghl_contact_id?: string;
          assigned_to?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          tags?: string[];
          status?: string;
          first_contacted_at?: string | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ghl_opportunities: {
        Row: {
          id: string;
          client_id: string;
          ghl_opportunity_id: string;
          contact_id: string | null;
          assigned_to: string | null;
          pipeline_id: string | null;
          pipeline_stage_id: string | null;
          name: string | null;
          status: string;
          monetary_value: number | null;
          raw: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          ghl_opportunity_id: string;
          contact_id?: string | null;
          assigned_to?: string | null;
          pipeline_id?: string | null;
          pipeline_stage_id?: string | null;
          name?: string | null;
          status?: string;
          monetary_value?: number | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          ghl_opportunity_id?: string;
          contact_id?: string | null;
          assigned_to?: string | null;
          pipeline_id?: string | null;
          pipeline_stage_id?: string | null;
          name?: string | null;
          status?: string;
          monetary_value?: number | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ghl_messages: {
        Row: {
          id: string;
          client_id: string;
          ghl_message_id: string;
          contact_id: string | null;
          conversation_id: string | null;
          direction: "inbound" | "outbound";
          message_type: string | null;
          body: string | null;
          status: string | null;
          sent_at: string | null;
          raw: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          ghl_message_id: string;
          contact_id?: string | null;
          conversation_id?: string | null;
          direction: "inbound" | "outbound";
          message_type?: string | null;
          body?: string | null;
          status?: string | null;
          sent_at?: string | null;
          raw?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          ghl_message_id?: string;
          contact_id?: string | null;
          conversation_id?: string | null;
          direction?: "inbound" | "outbound";
          message_type?: string | null;
          body?: string | null;
          status?: string | null;
          sent_at?: string | null;
          raw?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      ghl_sync_logs: {
        Row: {
          id: string;
          client_id: string;
          sync_type: "users" | "contacts" | "opportunities" | "messages" | "pipelines" | "full";
          status: "pending" | "running" | "success" | "failed";
          started_at: string;
          finished_at: string | null;
          records_synced: number;
          error_message: string | null;
          raw: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          sync_type: "users" | "contacts" | "opportunities" | "messages" | "pipelines" | "full";
          status?: "pending" | "running" | "success" | "failed";
          started_at?: string;
          finished_at?: string | null;
          records_synced?: number;
          error_message?: string | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          sync_type?: "users" | "contacts" | "opportunities" | "messages" | "pipelines" | "full";
          status?: "pending" | "running" | "success" | "failed";
          started_at?: string;
          finished_at?: string | null;
          records_synced?: number;
          error_message?: string | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ghl_pipelines: {
        Row: {
          id: string;
          client_id: string;
          ghl_pipeline_id: string;
          name: string;
          raw: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          ghl_pipeline_id: string;
          name: string;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          ghl_pipeline_id?: string;
          name?: string;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ghl_pipeline_stages: {
        Row: {
          id: string;
          client_id: string;
          pipeline_id: string;
          ghl_stage_id: string;
          name: string;
          position: number | null;
          raw: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          pipeline_id: string;
          ghl_stage_id: string;
          name: string;
          position?: number | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          pipeline_id?: string;
          ghl_stage_id?: string;
          name?: string;
          position?: number | null;
          raw?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_ghl_connection: {
        Args: { p_location_id: string; p_token: string };
        Returns: undefined;
      };
      disconnect_ghl_connection: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      current_client_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_ghl_token: {
        Args: { p_client_id: string };
        Returns: string | null;
      };
      dashboard_stat_counts: {
        Args: Record<string, never>;
        Returns: {
          total_contacts: number;
          total_opportunities: number;
          open_opportunities: number;
          won_opportunities: number;
          lost_opportunities: number;
          total_messages: number;
          inbound_messages: number;
          outbound_messages: number;
          total_users: number;
        }[];
      };
      dashboard_pipeline_summary: {
        Args: Record<string, never>;
        Returns: {
          pipeline_id: string | null;
          pipeline_stage_id: string | null;
          pipeline_name: string | null;
          stage_name: string | null;
          opportunity_count: number;
          total_value: number;
        }[];
      };
      dashboard_status_breakdown: {
        Args: Record<string, never>;
        Returns: {
          status: string;
          opportunity_count: number;
          total_value: number;
        }[];
      };
      dashboard_contacts_by_source: {
        Args: { p_limit?: number };
        Returns: {
          source: string;
          contact_count: number;
        }[];
      };
      dashboard_messages_by_day: {
        Args: { p_days_back?: number };
        Returns: {
          day: string;
          inbound_count: number;
          outbound_count: number;
        }[];
      };
      dashboard_agent_leaderboard: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          total_contacts: number;
          total_opportunities: number;
          won_opportunities: number;
          total_value: number;
        }[];
      };
      dashboard_response_time_stats: {
        Args: { p_start?: string; p_end?: string };
        Returns: {
          avg_seconds: number | null;
          median_seconds: number | null;
          min_seconds: number | null;
          max_seconds: number | null;
          sample_count: number;
        }[];
      };
      dashboard_response_time_by_agent: {
        Args: { p_start?: string; p_end?: string };
        Returns: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          avg_seconds: number | null;
          median_seconds: number | null;
          sample_count: number;
        }[];
      };
      dashboard_response_time_by_day: {
        Args: { p_start?: string; p_end?: string };
        Returns: {
          day: string;
          avg_seconds: number | null;
          median_seconds: number | null;
          sample_count: number;
        }[];
      };
      agent_performance_stats: {
        Args: { p_start?: string; p_end?: string; p_user_id?: string };
        Returns: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          assigned_leads: number;
          contacted_leads: number;
          qualified_opportunities: number;
          won_opportunities: number;
          lost_opportunities: number;
          win_rate: number | null;
          avg_response_seconds: number | null;
          median_response_seconds: number | null;
          total_won_value: number;
        }[];
      };
      agent_response_time_by_day: {
        Args: { p_user_id: string; p_start?: string; p_end?: string };
        Returns: {
          day: string;
          avg_seconds: number | null;
          median_seconds: number | null;
          sample_count: number;
        }[];
      };
      agent_recent_activity: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: {
          message_id: string;
          contact_id: string;
          contact_first_name: string | null;
          contact_last_name: string | null;
          direction: string;
          message_type: string | null;
          body: string | null;
          sent_at: string | null;
        }[];
      };
    };
  };
}
