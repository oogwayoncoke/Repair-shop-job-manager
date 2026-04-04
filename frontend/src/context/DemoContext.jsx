import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const DemoContext = createContext(null);

const SEED = {
  workOrders: [
    {
      id: 1,
      ticket_id: "SR-26-0001",
      item_name: "iPhone 14 Pro",
      status: "diagnosing",
      status_display: "In Diagnosis",
      assigned_osta_tech: 10,
      assigned_sabi_tech: 20,
      estimate_price: "350.00",
      description:
        "Screen flickering after water damage. Customer reports dropping phone in pool.",
      created_at: "2026-03-28T10:00:00Z",
      parts_used: [
        {
          id: 1,
          inventory_item: 1,
          part_name: "OLED Display Module",
          quantity_used: 1,
          price_at_use: "280.00",
        },
      ],
      sessions: [
        {
          id: 1,
          duration_seconds: 3240,
          is_active: false,
          service_name: "General Diagnosis",
          end_time: "2026-03-28T11:54:00Z",
          start_time: "2026-03-28T11:00:00Z",
        },
      ],
      services: [2],
      service_details: [
        {
          id: 2,
          service_name: "Water Damage Assessment",
          cost: "150.00",
          standard_duration: "01:30:00",
        },
      ],
      requisitions: [
        {
          id: 1,
          inventory_item: 1,
          part_name: "OLED Display Module",
          quantity_used: 1,
          price_at_use: "280.00",
        },
      ],
    },
    {
      id: 2,
      ticket_id: "SR-26-0002",
      item_name: 'MacBook Pro 16"',
      status: "ready",
      status_display: "Ready for Pickup",
      assigned_osta_tech: 10,
      assigned_sabi_tech: null,
      estimate_price: "800.00",
      description:
        "Keyboard replacement — several keys unresponsive. Battery health at 67%.",
      created_at: "2026-03-27T14:30:00Z",
      parts_used: [
        {
          id: 2,
          inventory_item: 2,
          part_name: "Keyboard Assembly",
          quantity_used: 1,
          price_at_use: "420.00",
        },
        {
          id: 3,
          inventory_item: 3,
          part_name: "Battery Pack",
          quantity_used: 1,
          price_at_use: "180.00",
        },
      ],
      sessions: [
        {
          id: 2,
          duration_seconds: 7200,
          is_active: false,
          service_name: "Hardware Repair",
          end_time: "2026-03-27T18:30:00Z",
          start_time: "2026-03-27T16:30:00Z",
        },
      ],
      services: [1],
      service_details: [
        {
          id: 1,
          service_name: "Hardware Repair",
          cost: "200.00",
          standard_duration: "02:00:00",
        },
      ],
      requisitions: [
        {
          id: 2,
          inventory_item: 2,
          part_name: "Keyboard Assembly",
          quantity_used: 1,
          price_at_use: "420.00",
        },
        {
          id: 3,
          inventory_item: 3,
          part_name: "Battery Pack",
          quantity_used: 1,
          price_at_use: "180.00",
        },
      ],
      invoice: { id: 1, is_paid: false, total_amount: "950.00" },
    },
    {
      id: 3,
      ticket_id: "SR-26-0003",
      item_name: "Samsung Galaxy S24",
      status: "pending",
      status_display: "Pending",
      assigned_osta_tech: null,
      assigned_sabi_tech: null,
      estimate_price: "200.00",
      description: "Cracked back glass and charging port not working.",
      created_at: "2026-03-31T09:00:00Z",
      parts_used: [],
      sessions: [],
      services: [],
      service_details: [],
      requisitions: [],
    },
  ],

  inventory: [
    {
      id: 1,
      name: "OLED Display Module",
      sku: "DSP-OLED-001",
      product_type: "PART",
      cost_price: "200.00",
      retail_price: "280.00",
      stock_count: 3,
      low_stock_threshold: 5,
      is_active: true,
      specifications: { brand: "OEM", model: "Universal" },
    },
    {
      id: 2,
      name: "Keyboard Assembly",
      sku: "KBD-MBP-16",
      product_type: "PART",
      cost_price: "300.00",
      retail_price: "420.00",
      stock_count: 2,
      low_stock_threshold: 3,
      is_active: true,
      specifications: { brand: "Apple", model: 'MacBook Pro 16"' },
    },
    {
      id: 3,
      name: "Battery Pack",
      sku: "BAT-MBP-16",
      product_type: "PART",
      cost_price: "120.00",
      retail_price: "180.00",
      stock_count: 8,
      low_stock_threshold: 5,
      is_active: true,
      specifications: { brand: "OEM", model: "Compatible" },
    },
    {
      id: 4,
      name: "Screen Protector",
      sku: "ACC-SCRN-001",
      product_type: "RETAIL",
      cost_price: "15.00",
      retail_price: "35.00",
      stock_count: 24,
      low_stock_threshold: 10,
      is_active: true,
      specifications: { brand: "Tempered", model: "Universal" },
    },
  ],

  staff: {
    ostas: [
      {
        id: 10,
        user: 10,
        username: "omar.osta",
        tech_level: "OSTA",
        role: "TECH",
        hourly_rate: "120.00",
      },
    ],
    sabis: [
      {
        id: 20,
        user: 20,
        username: "karim.sabi",
        tech_level: "SABI",
        role: "TECH",
        hourly_rate: "60.00",
      },
    ],
    treasury: [
      {
        id: 10,
        user: 10,
        username: "omar.osta",
        tech_level: "OSTA",
        role: "TECH",
        hourly_rate: "120.00",
      },
      {
        id: 20,
        user: 20,
        username: "karim.sabi",
        tech_level: "SABI",
        role: "TECH",
        hourly_rate: "60.00",
      },
    ],
  },

  finance: {
    total_revenue: 18500.0,
    total_expenses: 9200.0,
    net_profit: 9300.0,
    expense_breakdown: { parts: 5400, labor: 2800, rent: 800, utilities: 200 },
  },

  services: [
    {
      id: 1,
      service_name: "Hardware Repair",
      cost: "200.00",
      standard_duration: "02:00:00",
      tenant: "demo",
    },
    {
      id: 2,
      service_name: "Water Damage Assessment",
      cost: "150.00",
      standard_duration: "01:30:00",
      tenant: "demo",
    },
    {
      id: 3,
      service_name: "Software Recovery",
      cost: "100.00",
      standard_duration: "01:00:00",
      tenant: "demo",
    },
  ],

  invoices: [
    {
      id: 1,
      work_order: 2,
      work_order_ticket_id: "SR-26-0002",
      is_paid: false,
      labor_cost: 350.0,
      tax_amount: 119.0,
      total_amount: 969.0,
      parts_breakdown: [
        { name: "Keyboard Assembly", quantity: 1, price: 420.0 },
        { name: "Battery Pack", quantity: 1, price: 180.0 },
      ],
      services_breakdown: [{ name: "Hardware Repair", cost: 200.0 }],
    },
  ],
};

// Demo JWT payloads for each role
export const DEMO_TOKENS = {
  OWNER: {
    access: "demo_owner_token",
    payload: {
      role: "OWNER",
      tech_level: "NONE",
      staff_id: "1",
      tenant_id: "demo-tenant",
      user_id: 1,
      username: "demo.owner",
    },
  },
  OSTA: {
    access: "demo_osta_token",
    payload: {
      role: "TECH",
      tech_level: "OSTA",
      staff_id: "10",
      tenant_id: "demo-tenant",
      user_id: 10,
      username: "omar.osta",
    },
  },
  SABI: {
    access: "demo_sabi_token",
    payload: {
      role: "TECH",
      tech_level: "SABI",
      staff_id: "20",
      tenant_id: "demo-tenant",
      user_id: 20,
      username: "karim.sabi",
    },
  },
  CUSTOMER: {
    access: "demo_customer_token",
    payload: {
      role: "CUSTOMER",
      tech_level: "NONE",
      staff_id: "99",
      tenant_id: "demo-tenant",
      user_id: 99,
      username: "demo.customer",
    },
  },
};

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(
    () => localStorage.getItem("demo_mode") === "true",
  );
  const [demoRole, setDemoRole] = useState(
    () => localStorage.getItem("demo_role") || null,
  );
  const storeRef = useRef(JSON.parse(JSON.stringify(SEED))); // deep clone

  const enterDemo = useCallback((role) => {
    const store = JSON.parse(JSON.stringify(SEED));
    storeRef.current = store;
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem("demo_role", role);

    const tokenData = DEMO_TOKENS[role];
    // Create a real JWT-shaped token that jwtDecode can parse.
    // jwtDecode only reads the middle segment — header and sig are ignored.
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const payload = btoa(JSON.stringify(tokenData.payload))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const fakeToken = `${header}.${payload}.demo_signature`;
    localStorage.setItem("access", fakeToken);
    localStorage.setItem("refresh", "demo_refresh");

    setDemoRole(role);
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    localStorage.removeItem("demo_mode");
    localStorage.removeItem("demo_role");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsDemo(false);
    setDemoRole(null);
    storeRef.current = JSON.parse(JSON.stringify(SEED));
  }, []);

  // The mock API handler — intercepts calls and returns data from storeRef
  const mockApi = useCallback(async (method, url, data) => {
    const store = storeRef.current;
    await new Promise((r) => setTimeout(r, 80)); // realistic latency

    // Work Orders
    if (url.match(/\/shops\/work-orders\/?$/) && method === "GET") {
      return { data: store.workOrders };
    }
    if (url.match(/\/shops\/work-orders\/(\d+)\/?$/) && method === "GET") {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const order = store.workOrders.find((o) => o.id === id);
      if (!order) throw { response: { status: 404 } };
      return { data: order };
    }
    if (url.match(/\/shops\/work-orders\/(\d+)\/?$/) && method === "PATCH") {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const idx = store.workOrders.findIndex((o) => o.id === id);
      if (idx !== -1)
        store.workOrders[idx] = { ...store.workOrders[idx], ...data };
      return { data: store.workOrders[idx] };
    }
    if (url.match(/\/shops\/work-orders\/(\d+)\/assign-techs\/?$/)) {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const idx = store.workOrders.findIndex((o) => o.id === id);
      if (idx !== -1) {
        store.workOrders[idx] = { ...store.workOrders[idx], ...data };
        if (data.assigned_osta_tech || data.assigned_sabi_tech) {
          if (store.workOrders[idx].status === "pending")
            store.workOrders[idx].status = "diagnosing";
        }
      }
      return { data: store.workOrders[idx] };
    }
    if (url.match(/\/shops\/work-orders\/(\d+)\/generate-invoice\/?$/)) {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const existing = store.invoices.find((i) => i.work_order === id);
      if (existing)
        return {
          data: {
            id: existing.id,
            total: existing.total_amount,
            status: "updated",
          },
        };
      const newInvoice = {
        id: store.invoices.length + 1,
        work_order: id,
        total: 850.0,
        status: "created",
      };
      store.invoices.push(newInvoice);
      return { data: newInvoice };
    }

    // Inventory
    if (url.match(/\/shops\/inventory\/?$/) && method === "GET")
      return { data: store.inventory };
    if (url.match(/\/shops\/inventory\/?$/) && method === "POST") {
      const newItem = { id: store.inventory.length + 10, ...data };
      store.inventory.push(newItem);
      return { data: newItem };
    }
    if (url.match(/\/shops\/inventory\/(\d+)\/?$/) && method === "PUT") {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const idx = store.inventory.findIndex((i) => i.id === id);
      if (idx !== -1)
        store.inventory[idx] = { ...store.inventory[idx], ...data };
      return { data: store.inventory[idx] };
    }

    // Staff
    if (url.includes("/shops/staff/ostas/")) return { data: store.staff.ostas };
    if (url.includes("/shops/staff/sabis/")) return { data: store.staff.sabis };
    if (url.includes("/shops/staff/treasury/"))
      return { data: store.staff.treasury };
    if (url.match(/\/shops\/profiles\/(\d+)\/?$/)) {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const member = store.staff.treasury.find((s) => s.id === id);
      return { data: { ...member, ...(data || {}) } };
    }

    // Finance
    if (url.includes("/shops/finance/summary/")) return { data: store.finance };

    // Services
    if (url.match(/\/shops\/services\/?$/) && method === "GET")
      return { data: store.services };
    if (url.match(/\/shops\/services\/?$/) && method === "POST") {
      const newSvc = {
        id: store.services.length + 10,
        tenant: "demo",
        ...data,
      };
      store.services.push(newSvc);
      return { data: newSvc };
    }

    // Part usage
    if (url.match(/\/shops\/part-usage\/?$/) && method === "POST") {
      const newUsage = { id: Date.now(), price_at_use: "0.00", ...data };
      const order = store.workOrders.find((o) => o.id === data.work_order);
      if (order) {
        order.parts_used = [...(order.parts_used || []), newUsage];
        order.requisitions = [...(order.requisitions || []), newUsage];
      }
      return { data: newUsage };
    }
    if (url.match(/\/shops\/part-usage\/(\d+)\/?$/) && method === "DELETE") {
      const id = parseInt(url.match(/(\d+)/)[1]);
      store.workOrders.forEach((o) => {
        o.parts_used = (o.parts_used || []).filter((p) => p.id !== id);
        o.requisitions = (o.requisitions || []).filter((p) => p.id !== id);
      });
      return { data: {} };
    }

    // Work sessions
    if (url.includes("/shops/work-sessions/stop_session/"))
      return { data: { status: "stopped" } };
    if (url.match(/\/shops\/work-sessions\/(\d+)\/start_order\/?$/)) {
      return {
        data: {
          id: Date.now(),
          is_active: true,
          start_time: new Date().toISOString(),
          work_order: parseInt(url.match(/(\d+)/)[1]),
        },
      };
    }
    if (url.includes("/shops/work-sessions/")) return { data: [] };

    // Invoices
    if (url.match(/\/shops\/invoices\/?$/) && method === "GET")
      return { data: store.invoices };
    if (url.match(/\/shops\/invoices\/(\d+)\/?$/) && method === "GET") {
      const id = parseInt(url.match(/(\d+)/)[1]);
      return {
        data: store.invoices.find((i) => i.id === id) || store.invoices[0],
      };
    }
    if (url.match(/\/shops\/invoices\/(\d+)\/mark-paid\/?$/)) {
      const id = parseInt(url.match(/(\d+)/)[1]);
      const inv = store.invoices.find((i) => i.id === id);
      if (inv) inv.is_paid = true;
      return { data: { status: "settled", invoice_id: id } };
    }

    // Invites (no-op in demo)
    if (url.includes("/shops/invites/")) {
      return {
        data: {
          id: "demo-token-uuid",
          role: "CUSTOMER",
          token_type: "CUSTOMER_INVITE",
        },
      };
    }

    // Fallback
    return { data: {} };
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        demoRole,
        enterDemo,
        exitDemo,
        mockApi,
        store: storeRef,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
