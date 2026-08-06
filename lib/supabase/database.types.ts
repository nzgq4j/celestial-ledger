export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          id: number;
          actor_id: string;
          action: string;
          target_user_id: string | null;
          setting_key: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id: string;
          action: string;
          target_user_id?: string | null;
          setting_key?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string;
          action?: string;
          target_user_id?: string | null;
          setting_key?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: string;
          granted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role: string;
          granted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
          granted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: number;
          metadata: Json;
          resource_id: string | null;
          resource_type: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: never;
          metadata?: Json;
          resource_id?: string | null;
          resource_type?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: never;
          metadata?: Json;
          resource_id?: string | null;
          resource_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          reason: string;
          message: string;
          notification_status: string;
          notification_id: string | null;
          notification_attempted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          reason: string;
          message: string;
          notification_status?: string;
          notification_id?: string | null;
          notification_attempted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          reason?: string;
          message?: string;
          notification_status?: string;
          notification_id?: string | null;
          notification_attempted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          author_id: string;
          author_name: string;
          slug: string;
          title: string;
          excerpt: string;
          body: string;
          seo_title: string | null;
          seo_description: string | null;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          author_name: string;
          slug: string;
          title: string;
          excerpt: string;
          body: string;
          seo_title?: string | null;
          seo_description?: string | null;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          author_name?: string;
          slug?: string;
          title?: string;
          excerpt?: string;
          body?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      birth_profiles: {
        Row: {
          birth_date: string;
          birth_time: string | null;
          calculation_version: string | null;
          chart: Json | null;
          city: string;
          country: string;
          created_at: string;
          disambiguation: string | null;
          display_name: string;
          expires_at: string;
          id: string;
          label: string;
          latitude: number;
          longitude: number;
          region: string | null;
          time_unknown: boolean;
          time_zone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          birth_date: string;
          birth_time?: string | null;
          calculation_version?: string | null;
          chart?: Json | null;
          city: string;
          country: string;
          created_at?: string;
          disambiguation?: string | null;
          display_name: string;
          expires_at?: string;
          id?: string;
          label: string;
          latitude: number;
          longitude: number;
          region?: string | null;
          time_unknown?: boolean;
          time_zone: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          birth_date?: string;
          birth_time?: string | null;
          calculation_version?: string | null;
          chart?: Json | null;
          city?: string;
          country?: string;
          created_at?: string;
          disambiguation?: string | null;
          display_name?: string;
          expires_at?: string;
          id?: string;
          label?: string;
          latitude?: number;
          longitude?: number;
          region?: string | null;
          time_unknown?: boolean;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_readings: {
        Row: {
          analysis: Json;
          birth_profile_id: string;
          cache_key: string;
          calculation_version: string;
          capability: string;
          content: Json;
          created_at: string;
          ephemeris_version: string;
          evidence: Json;
          expires_at: string;
          failure_code: string | null;
          generated_at: string;
          id: string;
          locale: string;
          method_version: string;
          observation_time_zone: string;
          reading_date: string;
          rule_version: string;
          schema_version: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          analysis: Json;
          birth_profile_id: string;
          cache_key: string;
          calculation_version: string;
          capability?: string;
          content: Json;
          created_at?: string;
          ephemeris_version: string;
          evidence: Json;
          expires_at?: string;
          failure_code?: string | null;
          generated_at?: string;
          id?: string;
          locale: string;
          method_version: string;
          observation_time_zone: string;
          reading_date: string;
          rule_version: string;
          schema_version: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          analysis?: Json;
          birth_profile_id?: string;
          cache_key?: string;
          calculation_version?: string;
          capability?: string;
          content?: Json;
          created_at?: string;
          ephemeris_version?: string;
          evidence?: Json;
          expires_at?: string;
          failure_code?: string | null;
          generated_at?: string;
          id?: string;
          locale?: string;
          method_version?: string;
          observation_time_zone?: string;
          reading_date?: string;
          rule_version?: string;
          schema_version?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_readings_birth_profile_id_fkey";
            columns: ["birth_profile_id"];
            isOneToOne: false;
            referencedRelation: "birth_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      commerce_plans: {
        Row: {
          active: boolean;
          billing_interval: string | null;
          catalog_version: number;
          created_at: string;
          currency: string | null;
          name: string;
          plan_key: string;
          rank: number;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          unit_amount: number | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          billing_interval?: string | null;
          catalog_version?: number;
          created_at?: string;
          currency?: string | null;
          name: string;
          plan_key: string;
          rank: number;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          unit_amount?: number | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          billing_interval?: string | null;
          catalog_version?: number;
          created_at?: string;
          currency?: string | null;
          name?: string;
          plan_key?: string;
          rank?: number;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          unit_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_customers: {
        Row: {
          created_at: string;
          id: string;
          stripe_customer_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          stripe_customer_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          stripe_customer_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      account_subscriptions: {
        Row: {
          billing_customer_id: string;
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          grace_ends_at: string | null;
          id: string;
          last_stripe_event_created: number;
          plan_key: string;
          status: string;
          stripe_subscription_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          billing_customer_id: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          grace_ends_at?: string | null;
          id?: string;
          last_stripe_event_created?: number;
          plan_key: string;
          status: string;
          stripe_subscription_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          billing_customer_id?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          grace_ends_at?: string | null;
          id?: string;
          last_stripe_event_created?: number;
          plan_key?: string;
          status?: string;
          stripe_subscription_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      entitlements: {
        Row: {
          consumed_at: string | null;
          granted_at: string;
          id: string;
          order_id: string;
          report_type: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          consumed_at?: string | null;
          granted_at?: string;
          id?: string;
          order_id: string;
          report_type: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          consumed_at?: string | null;
          granted_at?: string;
          id?: string;
          order_id?: string;
          report_type?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "entitlements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_report_type_fkey";
            columns: ["report_type"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["report_type"];
          },
        ];
      };
      marketing_subscribers: {
        Row: {
          consent_source: string;
          consent_version: string;
          consented_at: string;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          locale: string;
          linked_user_id: string | null;
          status: string;
          unsubscribed_at: string | null;
          updated_at: string;
        };
        Insert: {
          consent_source: string;
          consent_version: string;
          consented_at?: string;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          locale?: string;
          linked_user_id?: string | null;
          status?: string;
          unsubscribed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          consent_source?: string;
          consent_version?: string;
          consented_at?: string;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          locale?: string;
          linked_user_id?: string | null;
          status?: string;
          unsubscribed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          amount_total: number | null;
          created_at: string;
          currency: string | null;
          id: string;
          idempotency_key: string;
          report_type: string;
          status: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount_total?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          idempotency_key: string;
          report_type: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount_total?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          idempotency_key?: string;
          report_type?: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_report_type_fkey";
            columns: ["report_type"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["report_type"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          catalog_version: number;
          created_at: string;
          currency: string | null;
          description: string;
          name: string;
          report_type: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          synced_at: string | null;
          unit_amount: number | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          catalog_version?: number;
          created_at?: string;
          currency?: string | null;
          description: string;
          name: string;
          report_type: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          synced_at?: string | null;
          unit_amount?: number | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          catalog_version?: number;
          created_at?: string;
          currency?: string | null;
          description?: string;
          name?: string;
          report_type?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          synced_at?: string | null;
          unit_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          adult_confirmed_at: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          report_locale: string | null;
          updated_at: string;
        };
        Insert: {
          adult_confirmed_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          report_locale?: string | null;
          updated_at?: string;
        };
        Update: {
          adult_confirmed_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          report_locale?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_evidence: {
        Row: {
          calculation_version: string;
          ephemeris_version: string;
          evidence: Json;
          generated_at: string;
          report_id: string;
          timezone_name: string;
          user_id: string;
        };
        Insert: {
          calculation_version: string;
          ephemeris_version: string;
          evidence: Json;
          generated_at?: string;
          report_id: string;
          timezone_name: string;
          user_id: string;
        };
        Update: {
          calculation_version?: string;
          ephemeris_version?: string;
          evidence?: Json;
          generated_at?: string;
          report_id?: string;
          timezone_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: true;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          attempts: number;
          birth_profile_id: string;
          completed_at: string | null;
          created_at: string;
          entitlement_id: string;
          expires_at: string | null;
          failure_code: string | null;
          id: string;
          locale: string;
          model_version: string | null;
          next_attempt_at: string;
          output: Json | null;
          prompt_version: string;
          recovery_themes: Json | null;
          report_type: string;
          safety_version: string;
          schema_version: string;
          started_at: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          birth_profile_id: string;
          completed_at?: string | null;
          created_at?: string;
          entitlement_id: string;
          expires_at?: string | null;
          failure_code?: string | null;
          id?: string;
          locale?: string;
          model_version?: string | null;
          next_attempt_at?: string;
          output?: Json | null;
          prompt_version: string;
          recovery_themes?: Json | null;
          report_type: string;
          safety_version: string;
          schema_version: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          birth_profile_id?: string;
          completed_at?: string | null;
          created_at?: string;
          entitlement_id?: string;
          expires_at?: string | null;
          failure_code?: string | null;
          id?: string;
          locale?: string;
          model_version?: string | null;
          next_attempt_at?: string;
          output?: Json | null;
          prompt_version?: string;
          recovery_themes?: Json | null;
          report_type?: string;
          safety_version?: string;
          schema_version?: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_birth_profile_id_fkey";
            columns: ["birth_profile_id"];
            isOneToOne: false;
            referencedRelation: "birth_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_entitlement_id_fkey";
            columns: ["entitlement_id"];
            isOneToOne: true;
            referencedRelation: "entitlements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_report_type_fkey";
            columns: ["report_type"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["report_type"];
          },
        ];
      };
      stripe_events: {
        Row: {
          event_id: string;
          event_type: string;
          failure_code: string | null;
          processed_at: string | null;
          received_at: string;
          status: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          failure_code?: string | null;
          processed_at?: string | null;
          received_at?: string;
          status?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          failure_code?: string | null;
          processed_at?: string | null;
          received_at?: string;
          status?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_report_job: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["reports"]["Row"][];
      };
      complete_report_job: {
        Args: {
          p_calculation_version: string;
          p_ephemeris_version: string;
          p_evidence: Json;
          p_model_version: string;
          p_output: Json;
          p_report_id: string;
          p_timezone_name: string;
        };
        Returns: undefined;
      };
      fail_report_job: {
        Args: {
          p_failure_code: string;
          p_report_id: string;
          p_retryable: boolean;
        };
        Returns: undefined;
      };
      queue_paid_report: {
        Args: {
          p_birth_profile_id: string;
          p_entitlement_id: string;
          p_locale: string;
          p_prompt_version: string;
          p_recovery_themes?: Json | null;
          p_safety_version: string;
          p_schema_version: string;
          p_user_id: string;
        };
        Returns: string;
      };
      queue_complimentary_report: {
        Args: {
          p_birth_profile_id: string;
          p_locale: string;
          p_prompt_version: string;
          p_recovery_themes?: Json | null;
          p_report_type: string;
          p_safety_version: string;
          p_schema_version: string;
          p_user_id: string;
        };
        Returns: string;
      };
      process_stripe_event: {
        Args: {
          p_action: string;
          p_amount_total?: number | null;
          p_checkout_session_id?: string | null;
          p_currency?: string | null;
          p_event_id: string;
          p_event_type: string;
          p_order_id: string;
          p_payment_intent_id?: string | null;
          p_report_type?: string | null;
          p_user_id?: string | null;
        };
        Returns: string;
      };
      process_subscription_event: {
        Args: {
          p_cancel_at_period_end?: boolean;
          p_current_period_end?: string | null;
          p_current_period_start?: string | null;
          p_event_created: number;
          p_event_id: string;
          p_event_type: string;
          p_grace_ends_at?: string | null;
          p_plan_key: string;
          p_status: string;
          p_stripe_customer_id: string;
          p_stripe_subscription_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
