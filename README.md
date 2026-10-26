# ApexCRM - Customer Relationship Management System (DBMS Project)

An interactive, responsive, and modern website built for a Database Management System (DBMS) project. It models a relational CRM enterprise database featuring **6 connected tables**, live calculations, automated relationship management, and an Oracle SQL schema exporter.

---

## 🗄️ Relational Database Schema

This project accurately implements all tables specified in your Oracle SQL DDL definitions:

1. **`CUSTOMER`**
   - `CUSTOMER_ID NUMBER PRIMARY KEY`
   - `NAME VARCHAR2(30)`
   - `PHONE VARCHAR2(15)`
   - `EMAIL VARCHAR2(50)`
   - `ADDRESS VARCHAR2(50)`

2. **`EMPLOYEE`**
   - `EMPLOYEE_ID NUMBER PRIMARY KEY`
   - `EMPLOYEE_NAME VARCHAR2(50)`
   - `DEPARTMENT VARCHAR2(50)`
   - `PHONE VARCHAR2(15)`
   - `EMAIL VARCHAR2(50)`

3. **`PRODUCT`**
   - `PRODUCT_ID NUMBER PRIMARY KEY`
   - `PRODUCT_NAME VARCHAR2(30)`
   - `CATEGORY VARCHAR2(30)`
   - `PRICE NUMBER(10,2)`
   - `STOCK NUMBER`

4. **`PAYMENT`**
   - `PAYMENT_ID NUMBER PRIMARY KEY`
   - `AMOUNT NUMBER(10,2)`
   - `PAYMENT_DATE DATE`
   - `PAYMENT_METHOD VARCHAR2(30)`
   - `PAYMENT_STATUS VARCHAR2(30)`

5. **`ORDERS`** *(Central Relational Hub)*
   - `BOOKING_ID NUMBER PRIMARY KEY`
   - `ORDER_DATE DATE`
   - `QUANTITY NUMBER`
   - `TOTAL_AMOUNT NUMBER(10,2)` *(Dynamically calculated: `Price * Quantity`)*
   - `CUSTOMER_ID NUMBER (FK -> CUSTOMER)`
   - `EMPLOYEE_ID NUMBER (FK -> EMPLOYEE)`
   - `PRODUCT_ID NUMBER (FK -> PRODUCT)`
   - `PAYMENT_ID NUMBER (FK -> PAYMENT)`

6. **`SUPPORT`**
   - `TICKET_ID NUMBER PRIMARY KEY`
   - `ISSUE VARCHAR2(100)`
   - `STATUS VARCHAR2(30)` *(Open / In Progress / Resolved)*
   - `OPEN_DATE DATE`
   - `CUSTOMER_ID NUMBER (FK -> CUSTOMER)`

---

## 🚀 How to Run the Website

You have **two simple options** to run the website:

### Option 1: Direct Double-Click (Zero Setup Needed)
Simply navigate to your project folder:
`c:\Users\AMIRTHA\Downloads\DBMS PROJECT\`
and double-click **`index.html`**. It will open immediately in any browser (Google Chrome, Microsoft Edge, Brave, Firefox)!

### Option 2: Run via Node.js Server
Open a terminal (PowerShell or Command Prompt) in the project directory:
```bash
npm start
```
or
```bash
node server.js
```
Then open your browser and navigate to:
```
http://localhost:3000
```

---

## ✨ Features & Interactive Capabilities

### 1. Interactive Order & Booking Engine (`ORDERS`)
- **Booking ID selection / entry** (auto-increments to the next sequential ID).
- **Select Customer** from dropdown (displays customer name, ID, and phone number).
- **Select Product**: shows the unit price and available stock instantly.
- **Dynamic Price Calculation**: typing or changing the quantity automatically calculates and displays the `TOTAL_AMOUNT` in real-time (`TOTAL_AMOUNT = PRICE * QUANTITY`).
- **Select Sales Employee**: links employee ID, name, and department.
- **Integrated Payment Processor**: automatically generates the linked `PAYMENT_ID`, records payment method (Credit Card, UPI, Wire Transfer, Bank Transfer), and tracks payment status.
- **Celebration Confetti & Toast**: delightful visual feedback upon order confirmation!
- **Printable Order Invoice / Receipt**: view and print professional receipts showing all relational data.

### 2. Customer Relationship Management (`CUSTOMER`)
- Add, Edit, Delete customers with input validation.
- Search customers in real time by name, phone, email, address, or ID.
- **Customer 360° Profile**: view all past orders placed by any customer, total money spent, and their support ticket history.

### 3. Employee Roster (`EMPLOYEE`)
- Manage employees, their employee IDs, departments, phone numbers, and emails.
- Filter employees by department (e.g., Enterprise Sales, Technical Support, Customer Success).
- View employee performance: total deals handled and gross revenue generated.

### 4. Product Inventory (`PRODUCT`)
- Add and edit products, categories, unit prices, and stock counts.
- Dynamic stock tracking: placing an order automatically deducts available inventory.
- Low-stock warning indicators.

### 5. Support Ticket Helpdesk (`SUPPORT`)
- Ticket ID, Issue description, Open Date, and Customer ID.
- Quick inline status switcher (Open &rarr; In Progress &rarr; Resolved).
- Filter tickets by status or customer issue.

### 6. Relational Database Hub & SQL Console
- **Interactive Entity-Relationship (ER) Architecture**: visual schema cards showing all primary keys (🔑 PK) and foreign keys (🔗 FK).
- **Live SQL Join Runner**: execute pre-built multi-table queries (such as a 5-table JOIN linking `ORDERS`, `CUSTOMER`, `PRODUCT`, `EMPLOYEE`, and `PAYMENT`) and view the formatted tabular output.
- **Export Oracle SQL Dump**: one-click download of `crm_oracle_dump.sql` containing exact DDL table creation and DML insert statements for all records in the system.
- Standalone ready-to-use Oracle script also provided as [`crm_oracle_database.sql`](./crm_oracle_database.sql).

### 7. Persistent Local Storage
- All customers, employees, products, orders, payments, and tickets entered by you are saved in browser `localStorage`.
- Your entered data remains intact even if you refresh or close the page.
- "Reset to Sample Data" button allows you to restore factory sample records at any time.
- JSON Backup and Restore support.
- Dark / Light Theme toggle with persistent preference.
