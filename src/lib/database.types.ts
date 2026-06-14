export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cfd_campaigns: {
        Row: {
          created_at: string | null
          display_duration_seconds: number
          id: string
          image_url: string
          is_active: boolean
          media_type: string
          sort_order: number
          title: string | null
        }
        Insert: {
          created_at?: string | null
          display_duration_seconds?: number
          id?: string
          image_url: string
          is_active?: boolean
          media_type?: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          created_at?: string | null
          display_duration_seconds?: number
          id?: string
          image_url?: string
          is_active?: boolean
          media_type?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      ideal_stock: {
        Row: {
          id: string
          item_id: string
          max_qty: number
          min_qty: number
          quantity: number
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          id?: string
          item_id: string
          max_qty?: number
          min_qty?: number
          quantity?: number
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          id?: string
          item_id?: string
          max_qty?: number
          min_qty?: number
          quantity?: number
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideal_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideal_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "ideal_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_inventory_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideal_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "ideal_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      items_dictionary: {
        Row: {
          barcode: string | null
          category: string | null
          cost_price: number | null
          display_order: number | null
          es_opcion_kds: boolean | null
          history: Json | null
          id: string
          ignore_stock: boolean | null
          is_active: boolean | null
          is_global_stock: boolean | null
          name: string
          original_id: string
          physical_barcode: string | null
          sub_category: string | null
          type: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          cost_price?: number | null
          display_order?: number | null
          es_opcion_kds?: boolean | null
          history?: Json | null
          id: string
          ignore_stock?: boolean | null
          is_active?: boolean | null
          is_global_stock?: boolean | null
          name: string
          original_id: string
          physical_barcode?: string | null
          sub_category?: string | null
          type: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          cost_price?: number | null
          display_order?: number | null
          es_opcion_kds?: boolean | null
          history?: Json | null
          id?: string
          ignore_stock?: boolean | null
          is_active?: boolean | null
          is_global_stock?: boolean | null
          name?: string
          original_id?: string
          physical_barcode?: string | null
          sub_category?: string | null
          type?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kds_force_kitchen: {
        Row: {
          created_at: string
          id: number
          nombre: string | null
          producto_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          nombre?: string | null
          producto_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string | null
          producto_id?: number | null
        }
        Relationships: []
      }
      kds_tickets: {
        Row: {
          comment: string | null
          company_id: string | null
          customizations: Json | null
          device_alias: string | null
          id: string
          item_id_full: string
          item_name: string
          kds_id: string
          metadata: Json | null
          order_id_temporal: string
          pos_id: string | null
          quantity: number | null
          sent_at: string
          status: string | null
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          comment?: string | null
          company_id?: string | null
          customizations?: Json | null
          device_alias?: string | null
          id?: string
          item_id_full: string
          item_name: string
          kds_id: string
          metadata?: Json | null
          order_id_temporal: string
          pos_id?: string | null
          quantity?: number | null
          sent_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          comment?: string | null
          company_id?: string | null
          customizations?: Json | null
          device_alias?: string | null
          id?: string
          item_id_full?: string
          item_name?: string
          kds_id?: string
          metadata?: Json | null
          order_id_temporal?: string
          pos_id?: string | null
          quantity?: number | null
          sent_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      legacy_catalog_cache: {
        Row: {
          combos_json: Json
          hash: string | null
          id: string
          last_sync_at: string | null
          productos_json: Json
          recetas_json: Json
        }
        Insert: {
          combos_json?: Json
          hash?: string | null
          id: string
          last_sync_at?: string | null
          productos_json?: Json
          recetas_json?: Json
        }
        Update: {
          combos_json?: Json
          hash?: string | null
          id?: string
          last_sync_at?: string | null
          productos_json?: Json
          recetas_json?: Json
        }
        Relationships: []
      }
      pos_ghost_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          ghost_username: string
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status_code: number | null
        }
        Insert: {
          action: string
          created_at?: string | null
          ghost_username: string
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Update: {
          action?: string
          created_at?: string | null
          ghost_username?: string
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      pos_ghost_users: {
        Row: {
          cart_status: Json | null
          cookie: string | null
          health_checked_at: string | null
          health_error: string | null
          health_status: string | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          nombre: string | null
          registro: Json | null
          status: string | null
          token: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          cart_status?: Json | null
          cookie?: string | null
          health_checked_at?: string | null
          health_error?: string | null
          health_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          nombre?: string | null
          registro?: Json | null
          status?: string | null
          token?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          cart_status?: Json | null
          cookie?: string | null
          health_checked_at?: string | null
          health_error?: string | null
          health_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          nombre?: string | null
          registro?: Json | null
          status?: string | null
          token?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      pos_users: {
        Row: {
          active_warehouse_id: string | null
          avatar_settings: Json | null
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          nickname: string | null
          pin_code: string | null
          theme_settings: Json | null
          username: string
        }
        Insert: {
          active_warehouse_id?: string | null
          avatar_settings?: Json | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          nickname?: string | null
          pin_code?: string | null
          theme_settings?: Json | null
          username: string
        }
        Update: {
          active_warehouse_id?: string | null
          avatar_settings?: Json | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          nickname?: string | null
          pin_code?: string | null
          theme_settings?: Json | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_users_active_warehouse_id_fkey"
            columns: ["active_warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "pos_users_active_warehouse_id_fkey"
            columns: ["active_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_wifi_tickets: {
        Row: {
          apellido: string
          cajero_nombre: string | null
          cajero_pos_id: string | null
          cedula: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          apellido: string
          cajero_nombre?: string | null
          cajero_pos_id?: string | null
          cedula: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          apellido?: string
          cajero_nombre?: string | null
          cajero_pos_id?: string | null
          cedula?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      server_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          last_seen: string
          node_version: string | null
          pid: number | null
          start_time: string
          status: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          last_seen?: string
          node_version?: string | null
          pid?: number | null
          start_time?: string
          status?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          last_seen?: string
          node_version?: string | null
          pid?: number | null
          start_time?: string
          status?: string
        }
        Relationships: []
      }
      signage_workers: {
        Row: {
          id: string
          last_seen: string | null
          local_url: string | null
          machine_name: string
          status: string
          telemetry: Json | null
          tunnel_url: string | null
        }
        Insert: {
          id?: string
          last_seen?: string | null
          local_url?: string | null
          machine_name: string
          status?: string
          telemetry?: Json | null
          tunnel_url?: string | null
        }
        Update: {
          id?: string
          last_seen?: string | null
          local_url?: string | null
          machine_name?: string
          status?: string
          telemetry?: Json | null
          tunnel_url?: string | null
        }
        Relationships: []
      }
      stock_batches: {
        Row: {
          batch_code: string | null
          created_at: string | null
          expiration_date: string
          id: string
          item_id: string | null
          quantity: number
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          batch_code?: string | null
          created_at?: string | null
          expiration_date: string
          id?: string
          item_id?: string | null
          quantity?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          batch_code?: string | null
          created_at?: string | null
          expiration_date?: string
          id?: string
          item_id?: string | null
          quantity?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "stock_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_inventory_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "stock_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string | null
          destination_warehouse_id: string | null
          id: string
          item_id: string | null
          notes: string | null
          origin_warehouse_id: string | null
          performed_by: string | null
          quantity: number
          shift_id: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          type: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          destination_warehouse_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          origin_warehouse_id?: string | null
          performed_by?: string | null
          quantity: number
          shift_id?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          type?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          destination_warehouse_id?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          origin_warehouse_id?: string | null
          performed_by?: string | null
          quantity?: number
          shift_id?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "stock_movements_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_inventory_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_origin_warehouse_id_fkey"
            columns: ["origin_warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "stock_movements_origin_warehouse_id_fkey"
            columns: ["origin_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "user_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_shifts: {
        Row: {
          closed_at: string | null
          closing_metadata: Json | null
          created_at: string | null
          id: string
          initial_inventory: Json | null
          legacy_metadata: Json | null
          opening_metadata: Json | null
          physical_modules: Json | null
          started_at: string | null
          status: string | null
          user_id: string
          warehouse_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_metadata?: Json | null
          created_at?: string | null
          id?: string
          initial_inventory?: Json | null
          legacy_metadata?: Json | null
          opening_metadata?: Json | null
          physical_modules?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
          warehouse_id: string
        }
        Update: {
          closed_at?: string | null
          closing_metadata?: Json | null
          created_at?: string | null
          id?: string
          initial_inventory?: Json | null
          legacy_metadata?: Json | null
          opening_metadata?: Json | null
          physical_modules?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pos_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shifts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "user_shifts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas_master: {
        Row: {
          candy: Json | null
          consumos_calculados: Json | null
          created_at: string | null
          device_alias: string | null
          empresa_id: string | null
          id: string
          id_temporal: string | null
          id_usuario: string | null
          id_venta: number | null
          id_venta_candy: number | null
          nombre_impresora: string | null
          nro_comprobante: string | null
          nro_punto_venta: string | null
          pagos: Json | null
          pickup_info: Json | null
          raw_cerrar_venta: Json | null
          regionalizacion: string | null
          tasa_dia: number | null
          tickets: Json | null
          total_boletos: number | null
          total_candy: number | null
          total_global: number | null
          uuid_pos: string
        }
        Insert: {
          candy?: Json | null
          consumos_calculados?: Json | null
          created_at?: string | null
          device_alias?: string | null
          empresa_id?: string | null
          id?: string
          id_temporal?: string | null
          id_usuario?: string | null
          id_venta?: number | null
          id_venta_candy?: number | null
          nombre_impresora?: string | null
          nro_comprobante?: string | null
          nro_punto_venta?: string | null
          pagos?: Json | null
          pickup_info?: Json | null
          raw_cerrar_venta?: Json | null
          regionalizacion?: string | null
          tasa_dia?: number | null
          tickets?: Json | null
          total_boletos?: number | null
          total_candy?: number | null
          total_global?: number | null
          uuid_pos: string
        }
        Update: {
          candy?: Json | null
          consumos_calculados?: Json | null
          created_at?: string | null
          device_alias?: string | null
          empresa_id?: string | null
          id?: string
          id_temporal?: string | null
          id_usuario?: string | null
          id_venta?: number | null
          id_venta_candy?: number | null
          nombre_impresora?: string | null
          nro_comprobante?: string | null
          nro_punto_venta?: string | null
          pagos?: Json | null
          pickup_info?: Json | null
          raw_cerrar_venta?: Json | null
          regionalizacion?: string | null
          tasa_dia?: number | null
          tickets?: Json | null
          total_boletos?: number | null
          total_candy?: number | null
          total_global?: number | null
          uuid_pos?: string
        }
        Relationships: []
      }
      voucher_events: {
        Row: {
          created_at: string | null
          event_type: Database["public"]["Enums"]["voucher_event_type"]
          from_user_id: string | null
          id: string
          metadata: Json | null
          to_user_id: string | null
          venta_id: string | null
          voucher_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: Database["public"]["Enums"]["voucher_event_type"]
          from_user_id?: string | null
          id?: string
          metadata?: Json | null
          to_user_id?: string | null
          venta_id?: string | null
          voucher_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["voucher_event_type"]
          from_user_id?: string | null
          id?: string
          metadata?: Json | null
          to_user_id?: string | null
          venta_id?: string | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_events_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "pos_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_events_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "pos_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_events_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_schedules: {
        Row: {
          company: string | null
          created_at: string | null
          day_of_period: number
          end_of_month: boolean | null
          excluded_user_ids: Json | null
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          qty_per_user: number
          type_id: number | null
          updated_at: string | null
          validity_days: number
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          day_of_period?: number
          end_of_month?: boolean | null
          excluded_user_ids?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name: string
          qty_per_user?: number
          type_id?: number | null
          updated_at?: string | null
          validity_days?: number
        }
        Update: {
          company?: string | null
          created_at?: string | null
          day_of_period?: number
          end_of_month?: boolean | null
          excluded_user_ids?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          qty_per_user?: number
          type_id?: number | null
          updated_at?: string | null
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "voucher_schedules_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "voucher_types"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_types: {
        Row: {
          description: string | null
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          batch_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          short_code: string
          status: Database["public"]["Enums"]["voucher_status"]
          type_id: number | null
          user_id: string | null
          valid_from: string | null
        }
        Insert: {
          batch_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          short_code: string
          status?: Database["public"]["Enums"]["voucher_status"]
          type_id?: number | null
          user_id?: string | null
          valid_from?: string | null
        }
        Update: {
          batch_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          short_code?: string
          status?: Database["public"]["Enums"]["voucher_status"]
          type_id?: number | null
          user_id?: string | null
          valid_from?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "voucher_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pos_users"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock: {
        Row: {
          id: string
          item_id: string
          last_counted_at: string | null
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          item_id: string
          last_counted_at?: string | null
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          item_id?: string
          last_counted_at?: string | null
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_inventory_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          code: string
          created_at: string
          id: string
          identifier: string | null
          is_active: boolean
          is_blind_count_enabled: boolean | null
          manager_id: string | null
          name: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          identifier?: string | null
          is_active?: boolean
          is_blind_count_enabled?: boolean | null
          manager_id?: string | null
          name: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          identifier?: string | null
          is_active?: boolean
          is_blind_count_enabled?: boolean | null
          manager_id?: string | null
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_manager_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "pos_users"
            referencedColumns: ["id"]
          },
        ]
      }
      wbpp_movies: {
        Row: {
          backdrop_url: string | null
          created_at: string
          duration_mins: number | null
          genres: string[] | null
          grouped_ids: string[]
          id: string
          pos_aliases: Json
          pos_entries: Json
          pos_last_seen_at: string | null
          poster_url: string | null
          presale_date: string | null
          provider_metadata: Json
          rating: string | null
          release_date: string | null
          status: string
          synopsis: string | null
          title: string
          tmdb_id: number | null
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          duration_mins?: number | null
          genres?: string[] | null
          grouped_ids?: string[]
          id?: string
          pos_aliases?: Json
          pos_entries?: Json
          pos_last_seen_at?: string | null
          poster_url?: string | null
          presale_date?: string | null
          provider_metadata?: Json
          rating?: string | null
          release_date?: string | null
          status?: string
          synopsis?: string | null
          title: string
          tmdb_id?: number | null
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          duration_mins?: number | null
          genres?: string[] | null
          grouped_ids?: string[]
          id?: string
          pos_aliases?: Json
          pos_entries?: Json
          pos_last_seen_at?: string | null
          poster_url?: string | null
          presale_date?: string | null
          provider_metadata?: Json
          rating?: string | null
          release_date?: string | null
          status?: string
          synopsis?: string | null
          title?: string
          tmdb_id?: number | null
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wbpp_orphan_showtimes: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          pos_movie_title: string
          showtimes_count: number
          showtimes_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          pos_movie_title: string
          showtimes_count?: number
          showtimes_data?: Json
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          pos_movie_title?: string
          showtimes_count?: number
          showtimes_data?: Json
        }
        Relationships: []
      }
      wbpp_showtimes: {
        Row: {
          created_at: string
          dimension: string
          id: string
          is_active: boolean
          language: string
          movie_id: string
          numero_funcion: string | null
          numero_sala: string | null
          pos_metadata: Json
          pos_movie_title: string
          pos_show_id: string
          room_name: string | null
          show_date: string
          show_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimension?: string
          id?: string
          is_active?: boolean
          language?: string
          movie_id: string
          numero_funcion?: string | null
          numero_sala?: string | null
          pos_metadata?: Json
          pos_movie_title: string
          pos_show_id: string
          room_name?: string | null
          show_date: string
          show_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimension?: string
          id?: string
          is_active?: boolean
          language?: string
          movie_id?: string
          numero_funcion?: string | null
          numero_sala?: string | null
          pos_metadata?: Json
          pos_movie_title?: string
          pos_show_id?: string
          room_name?: string | null
          show_date?: string
          show_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wbpp_showtimes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "wbpp_movies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_combo_theoretical_stock: {
        Row: {
          combo_id: string | null
          theoretical_stock: number | null
          warehouse_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_warehouse_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_legacy_combos_exploded: {
        Row: {
          combo_id: string | null
          combo_name: string | null
          product_id: string | null
          required_qty: number | null
        }
        Relationships: []
      }
      v_legacy_products: {
        Row: {
          name: string | null
          product_id: string | null
          usa_stock: number | null
        }
        Relationships: []
      }
      v_legacy_recipes_exploded: {
        Row: {
          component_id: string | null
          component_type: string | null
          product_id: string | null
          required_qty: number | null
        }
        Relationships: []
      }
      v_product_theoretical_stock: {
        Row: {
          product_id: string | null
          theoretical_stock: number | null
          warehouse_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_warehouse_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "vw_detailed_inventory"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_detailed_inventory: {
        Row: {
          actual_quantity: number | null
          category: string | null
          cost_price: number | null
          item_id: string | null
          item_is_active: boolean | null
          item_name: string | null
          item_type: string | null
          original_id: string | null
          raw_quantity: number | null
          stock_updated_at: string | null
          unit: string | null
          warehouse_id: string | null
          warehouse_name: string | null
          warehouse_type: string | null
        }
        Relationships: []
      }
      vw_inventory_ledger: {
        Row: {
          category: string | null
          cost_price: number | null
          distributed_stock: number | null
          global_stock: number | null
          id: string | null
          is_active: boolean | null
          main_remanent: number | null
          name: string | null
          original_id: string | null
          type: string | null
          unit: string | null
          warehouse_map: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_auditor_inventory: {
        Args: { p_shift_id: string }
        Returns: Database["public"]["CompositeTypes"]["auditor_inventory_row"][]
        SetofOptions: {
          from: "*"
          to: "auditor_inventory_row"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pos_catalog_with_stock: {
        Args: { p_warehouse_id: string }
        Returns: Json
      }
      process_inventory_transfers: {
        Args: { p_transfers: Json; p_user_id: string }
        Returns: Json
      }
      registrar_venta_completa: { Args: { payload: Json }; Returns: Json }
    }
    Enums: {
      scrapp_tipo_item: "boleto" | "candy" | "combo" | "combo_componente"
      transfer_status:
        | "DRAFT"
        | "PENDING"
        | "IN_TRANSIT"
        | "RECEIVED"
        | "CANCELLED"
      voucher_event_type: "generated" | "transferred" | "redeemed" | "expired"
      voucher_status: "available" | "used" | "expired" | "voided"
    }
    CompositeTypes: {
      auditor_inventory_row: {
        item_id: string | null
        warehouse_id: string | null
        name: string | null
        sku: string | null
        physical_barcode: string | null
        category: string | null
        initial_qty: number | null
        db_stock_qty: number | null
        counted_qty: number | null
        is_multi_location: boolean | null
        primary_warehouse_id: string | null
        unified_diff: number | null
        is_blind_count: boolean | null
        distribution_map: Json | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      scrapp_tipo_item: ["boleto", "candy", "combo", "combo_componente"],
      transfer_status: [
        "DRAFT",
        "PENDING",
        "IN_TRANSIT",
        "RECEIVED",
        "CANCELLED",
      ],
      voucher_event_type: ["generated", "transferred", "redeemed", "expired"],
      voucher_status: ["available", "used", "expired", "voided"],
    },
  },
} as const
