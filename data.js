/**
 * ApexCRM - Database Management System Project
 * Initial Schema & Seed Data matching Oracle SQL definitions
 */

const CRM_DB_STORAGE_KEY = 'apex_crm_db_v1';

// Initial Seed Data
const INITIAL_DATABASE = {
  // Table 1: CUSTOMER
  // CUSTOMER_ID NUMBER PRIMARY KEY, NAME VARCHAR2(30), PHONE VARCHAR2(15), EMAIL VARCHAR2(50), ADDRESS VARCHAR2(50)
  customers: [
    {
      customer_id: 101,
      name: "Sophia Martinez",
      phone: "+1-555-0192",
      email: "sophia.m@example.com",
      address: "742 Evergreen Terrace, Springfield"
    },
    {
      customer_id: 102,
      name: "Alexander Wright",
      phone: "+1-555-0283",
      email: "a.wright@techcorp.io",
      address: "100 Innovation Way, Austin, TX"
    },
    {
      customer_id: 103,
      name: "Priya Sharma",
      phone: "+1-555-0374",
      email: "priya.sharma@globalnexus.com",
      address: "45 Silicon Boulevard, San Jose, CA"
    },
    {
      customer_id: 104,
      name: "Marcus Vance",
      phone: "+1-555-0465",
      email: "marcus.v@summitventures.net",
      address: "88 Pine Street, Seattle, WA"
    },
    {
      customer_id: 105,
      name: "Elena Rostova",
      phone: "+1-555-0556",
      email: "elena.r@cloudscale.org",
      address: "12 Marina View, San Francisco, CA"
    }
  ],

  // Table 2: EMPLOYEE
  // EMPLOYEE_ID NUMBER PRIMARY KEY, EMPLOYEE_NAME VARCHAR2(50), DEPARTMENT VARCHAR2(50), PHONE VARCHAR2(15), EMAIL VARCHAR2(50)
  employees: [
    {
      employee_id: 201,
      employee_name: "Ethan Walker",
      department: "Enterprise Sales",
      phone: "+1-555-1101",
      email: "ethan.walker@apexcrm.internal"
    },
    {
      employee_id: 202,
      employee_name: "Olivia Chen",
      department: "Customer Success",
      phone: "+1-555-1102",
      email: "olivia.chen@apexcrm.internal"
    },
    {
      employee_id: 203,
      employee_name: "David Kim",
      department: "Technical Support",
      phone: "+1-555-1103",
      email: "david.kim@apexcrm.internal"
    },
    {
      employee_id: 204,
      employee_name: "Rachel Green",
      department: "Account Management",
      phone: "+1-555-1104",
      email: "rachel.green@apexcrm.internal"
    },
    {
      employee_id: 205,
      employee_name: "James Wilson",
      department: "Enterprise Sales",
      phone: "+1-555-1105",
      email: "james.wilson@apexcrm.internal"
    }
  ],

  // Table 3: PRODUCT
  // PRODUCT_ID NUMBER PRIMARY KEY, PRODUCT_NAME VARCHAR2(30), CATEGORY VARCHAR2(30), PRICE NUMBER(10,2), STOCK NUMBER
  products: [
    {
      product_id: 301,
      product_name: "Apex CRM Cloud Suite",
      category: "Software Subscription",
      price: 499.00,
      stock: 120
    },
    {
      product_id: 302,
      product_name: "AI Analytics Pro Module",
      category: "Add-On License",
      price: 299.50,
      stock: 85
    },
    {
      product_id: 303,
      product_name: "Dedicated Cloud Server 1TB",
      category: "Infrastructure",
      price: 799.00,
      stock: 40
    },
    {
      product_id: 304,
      product_name: "24/7 Priority Support Tier",
      category: "Service Plan",
      price: 150.00,
      stock: 200
    },
    {
      product_id: 305,
      product_name: "Enterprise Security Gateway",
      category: "Cybersecurity",
      price: 950.00,
      stock: 35
    },
    {
      product_id: 306,
      product_name: "Automated Marketing Bot",
      category: "Software Add-On",
      price: 199.00,
      stock: 90
    }
  ],

  // Table 4: PAYMENT
  // PAYMENT_ID NUMBER PRIMARY KEY, AMOUNT NUMBER(10,2), PAYMENT_DATE DATE, PAYMENT_METHOD VARCHAR2(30), PAYMENT_STATUS VARCHAR2(30)
  payments: [
    {
      payment_id: 501,
      amount: 998.00,
      payment_date: "2026-10-15",
      payment_method: "Credit Card",
      payment_status: "Completed"
    },
    {
      payment_id: 502,
      amount: 799.00,
      payment_date: "2026-10-18",
      payment_method: "Bank Transfer",
      payment_status: "Completed"
    },
    {
      payment_id: 503,
      amount: 599.00,
      payment_date: "2026-10-21",
      payment_method: "UPI / Net Banking",
      payment_status: "Completed"
    },
    {
      payment_id: 504,
      amount: 1900.00,
      payment_date: "2026-10-23",
      payment_method: "Corporate Wire",
      payment_status: "Pending"
    },
    {
      payment_id: 505,
      amount: 499.00,
      payment_date: "2026-10-25",
      payment_method: "Credit Card",
      payment_status: "Completed"
    }
  ],

  // Table 5: ORDERS
  // BOOKING_ID NUMBER PRIMARY KEY, ORDER_DATE DATE, QUANTITY NUMBER, TOTAL_AMOUNT NUMBER(10,2),
  // CUSTOMER_ID NUMBER (FK -> CUSTOMER), EMPLOYEE_ID NUMBER (FK -> EMPLOYEE), PRODUCT_ID NUMBER (FK -> PRODUCT), PAYMENT_ID NUMBER (FK -> PAYMENT)
  orders: [
    {
      booking_id: 1001,
      order_date: "2026-10-15",
      quantity: 2,
      total_amount: 998.00, // 2 * 499.00
      customer_id: 101,
      employee_id: 201,
      product_id: 301,
      payment_id: 501
    },
    {
      booking_id: 1002,
      order_date: "2026-10-18",
      quantity: 1,
      total_amount: 799.00, // 1 * 799.00
      customer_id: 102,
      employee_id: 204,
      product_id: 303,
      payment_id: 502
    },
    {
      booking_id: 1003,
      order_date: "2026-10-21",
      quantity: 2,
      total_amount: 599.00, // 2 * 299.50
      customer_id: 103,
      employee_id: 205,
      product_id: 302,
      payment_id: 503
    },
    {
      booking_id: 1004,
      order_date: "2026-10-23",
      quantity: 2,
      total_amount: 1900.00, // 2 * 950.00
      customer_id: 104,
      employee_id: 201,
      product_id: 305,
      payment_id: 504
    },
    {
      booking_id: 1005,
      order_date: "2026-10-25",
      quantity: 1,
      total_amount: 499.00, // 1 * 499.00
      customer_id: 105,
      employee_id: 202,
      product_id: 301,
      payment_id: 505
    }
  ],

  // Table 6: SUPPORT
  // TICKET_ID NUMBER PRIMARY KEY, ISSUE VARCHAR2(100), STATUS VARCHAR2(30), OPEN_DATE DATE, CUSTOMER_ID NUMBER (FK -> CUSTOMER)
  support: [
    {
      ticket_id: 701,
      issue: "Webhook integration failure with internal ERP system",
      status: "In Progress",
      open_date: "2026-10-20",
      customer_id: 102
    },
    {
      ticket_id: 702,
      issue: "Request assistance setting up automated email workflows",
      status: "Open",
      open_date: "2026-10-24",
      customer_id: 101
    },
    {
      ticket_id: 703,
      issue: "Query regarding 24/7 Priority Support SLA response time",
      status: "Resolved",
      open_date: "2026-10-16",
      customer_id: 103
    },
    {
      ticket_id: 704,
      issue: "Security Gateway SSL certificate renewal assistance",
      status: "Open",
      open_date: "2026-10-25",
      customer_id: 104
    }
  ]
};

// Database Schema Meta Information for Documentation & SQL Generation
const DB_SCHEMA = {
  customer: {
    tableName: "CUSTOMER",
    primaryKey: "customer_id",
    fields: [
      { key: "customer_id", name: "CUSTOMER_ID", type: "NUMBER", required: true, isPk: true },
      { key: "name", name: "NAME", type: "VARCHAR2(30)", required: true },
      { key: "phone", name: "PHONE", type: "VARCHAR2(15)", required: true },
      { key: "email", name: "EMAIL", type: "VARCHAR2(50)", required: true },
      { key: "address", name: "ADDRESS", type: "VARCHAR2(50)", required: true }
    ],
    sqlCreate: `CREATE TABLE CUSTOMER (
  CUSTOMER_ID NUMBER PRIMARY KEY,
  NAME VARCHAR2(30),
  PHONE VARCHAR2(15),
  EMAIL VARCHAR2(50),
  ADDRESS VARCHAR2(50)
);`
  },
  employee: {
    tableName: "EMPLOYEE",
    primaryKey: "employee_id",
    fields: [
      { key: "employee_id", name: "EMPLOYEE_ID", type: "NUMBER", required: true, isPk: true },
      { key: "employee_name", name: "EMPLOYEE_NAME", type: "VARCHAR2(50)", required: true },
      { key: "department", name: "DEPARTMENT", type: "VARCHAR2(50)", required: true },
      { key: "phone", name: "PHONE", type: "VARCHAR2(15)", required: true },
      { key: "email", name: "EMAIL", type: "VARCHAR2(50)", required: true }
    ],
    sqlCreate: `CREATE TABLE EMPLOYEE (
  EMPLOYEE_ID NUMBER PRIMARY KEY,
  EMPLOYEE_NAME VARCHAR2(50),
  DEPARTMENT VARCHAR2(50),
  PHONE VARCHAR2(15),
  EMAIL VARCHAR2(50)
);`
  },
  product: {
    tableName: "PRODUCT",
    primaryKey: "product_id",
    fields: [
      { key: "product_id", name: "PRODUCT_ID", type: "NUMBER", required: true, isPk: true },
      { key: "product_name", name: "PRODUCT_NAME", type: "VARCHAR2(30)", required: true },
      { key: "category", name: "CATEGORY", type: "VARCHAR2(30)", required: true },
      { key: "price", name: "PRICE", type: "NUMBER(10,2)", required: true },
      { key: "stock", name: "STOCK", type: "NUMBER", required: true }
    ],
    sqlCreate: `CREATE TABLE PRODUCT (
  PRODUCT_ID NUMBER PRIMARY KEY,
  PRODUCT_NAME VARCHAR2(30),
  CATEGORY VARCHAR2(30),
  PRICE NUMBER(10,2),
  STOCK NUMBER
);`
  },
  payment: {
    tableName: "PAYMENT",
    primaryKey: "payment_id",
    fields: [
      { key: "payment_id", name: "PAYMENT_ID", type: "NUMBER", required: true, isPk: true },
      { key: "amount", name: "AMOUNT", type: "NUMBER(10,2)", required: true },
      { key: "payment_date", name: "PAYMENT_DATE", type: "DATE", required: true },
      { key: "payment_method", name: "PAYMENT_METHOD", type: "VARCHAR2(30)", required: true },
      { key: "payment_status", name: "PAYMENT_STATUS", type: "VARCHAR2(30)", required: true }
    ],
    sqlCreate: `CREATE TABLE PAYMENT (
  PAYMENT_ID NUMBER PRIMARY KEY,
  AMOUNT NUMBER(10,2),
  PAYMENT_DATE DATE,
  PAYMENT_METHOD VARCHAR2(30),
  PAYMENT_STATUS VARCHAR2(30)
);`
  },
  orders: {
    tableName: "ORDERS",
    primaryKey: "booking_id",
    fields: [
      { key: "booking_id", name: "BOOKING_ID", type: "NUMBER", required: true, isPk: true },
      { key: "order_date", name: "ORDER_DATE", type: "DATE", required: true },
      { key: "quantity", name: "QUANTITY", type: "NUMBER", required: true },
      { key: "total_amount", name: "TOTAL_AMOUNT", type: "NUMBER(10,2)", required: true },
      { key: "customer_id", name: "CUSTOMER_ID", type: "NUMBER", required: true, isFk: true, ref: "CUSTOMER(CUSTOMER_ID)" },
      { key: "employee_id", name: "EMPLOYEE_ID", type: "NUMBER", required: true, isFk: true, ref: "EMPLOYEE(EMPLOYEE_ID)" },
      { key: "product_id", name: "PRODUCT_ID", type: "NUMBER", required: true, isFk: true, ref: "PRODUCT(PRODUCT_ID)" },
      { key: "payment_id", name: "PAYMENT_ID", type: "NUMBER", required: true, isFk: true, ref: "PAYMENT(PAYMENT_ID)" }
    ],
    sqlCreate: `CREATE TABLE ORDERS (
  BOOKING_ID NUMBER PRIMARY KEY,
  ORDER_DATE DATE,
  QUANTITY NUMBER,
  TOTAL_AMOUNT NUMBER(10,2),
  CUSTOMER_ID NUMBER,
  EMPLOYEE_ID NUMBER,
  PRODUCT_ID NUMBER,
  PAYMENT_ID NUMBER,
  FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER(CUSTOMER_ID),
  FOREIGN KEY (EMPLOYEE_ID) REFERENCES EMPLOYEE(EMPLOYEE_ID),
  FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT(PRODUCT_ID),
  FOREIGN KEY (PAYMENT_ID) REFERENCES PAYMENT(PAYMENT_ID)
);`
  },
  support: {
    tableName: "SUPPORT",
    primaryKey: "ticket_id",
    fields: [
      { key: "ticket_id", name: "TICKET_ID", type: "NUMBER", required: true, isPk: true },
      { key: "issue", name: "ISSUE", type: "VARCHAR2(100)", required: true },
      { key: "status", name: "STATUS", type: "VARCHAR2(30)", required: true },
      { key: "open_date", name: "OPEN_DATE", type: "DATE", required: true },
      { key: "customer_id", name: "CUSTOMER_ID", type: "NUMBER", required: true, isFk: true, ref: "CUSTOMER(CUSTOMER_ID)" }
    ],
    sqlCreate: `CREATE TABLE SUPPORT (
  TICKET_ID NUMBER PRIMARY KEY,
  ISSUE VARCHAR2(100),
  STATUS VARCHAR2(30),
  OPEN_DATE DATE,
  CUSTOMER_ID NUMBER,
  FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER(CUSTOMER_ID)
);`
  }
};
