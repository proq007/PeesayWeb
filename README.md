# Personal Finance Management Application

**Your Path to Financial Clarity and Control**

## Description

**Elevator Pitch:** This application empowers you to effortlessly manage your finances, track spending, achieve savings goals, and make smarter financial decisions through intuitive dashboards and AI-powered insights.

**Detailed Overview:** This application is a modern, user-friendly personal finance management tool designed to empower individuals and families to take control of their financial health. Our intuitive dashboards and powerful features make it easy to manage budgets, track transactions, monitor savings, and gain valuable financial insights. Whether you're saving for a down payment, planning for retirement, or simply want to understand where your money is going, our application provides the tools you need to achieve your goals.

**Target Audience:** This application is designed for individuals and families who want to gain better control of their finances. Whether you are a seasoned budgeter or just beginning to manage your money, this app provides an intuitive and powerful way to help you track and manage your financial information.

For more information about the project, please refer to the [Blueprint](docs/blueprint.md)

### Key Features

**User-Focused Feature Breakdown:**

*   **Budget Management:**
    *   **User Story:** "As a user, I want to create custom budgets for different spending categories, so I can track my expenses effectively."
    *   **Description:** Create custom budgets with flexible time periods (weekly, monthly, annually). Track spending in real-time and receive intelligent alerts when you're nearing or exceeding budget limits. View spending breakdowns by categories and vendors.
*   **Transaction Tracking:**
    *   **User Story:** "As a user, I need to easily record and categorize transactions, so I can track where my money is going."
    *   **Description:** Easily record and categorize your financial transactions. Visualize your spending patterns through interactive charts and graphs. Search and filter transactions to gain a clear understanding of your finances.
*   **Savings Monitoring:**
    *   **User Story:** "As a user, I want to set savings goals and monitor my progress so I can stay motivated and on track."
    *   **Description:** Set savings goals and monitor your progress toward achieving them. Visualize your savings growth over time. Get insights into potential strategies to enhance your savings.
*   **AI-Powered Insights:**
    *   **User Story:** "As a user, I need personalized financial tips to make better decisions and optimize my finances."
    *   **Description:** Leverage the power of AI to get personalized financial tips tailored to your spending habits and goals. Receive recommendations for optimizing your spending and savings. Identify potential financial trends and make informed decisions.
*   **User-Friendly Dashboards:**
    *   **User Story:** "As a user, I need a clear and intuitive dashboard to see all my financial data at a glance."
    *   **Description:** Intuitive and easy-to-navigate user interface. Visualize all your financial information in one place with interactive charts and graphs.


## Technology Stack and Dependencies

### Core Technologies

This project is built using the following technologies:

*   **TypeScript:** For type-safe and scalable development.
*   **Next.js:** For server-side rendering, routing, and optimized performance.
*   **React:** For building the interactive user interface.
*   **Tailwind CSS:** For utility-first styling and rapid UI development.

**Why this technologies?**
* **Next.js:** It allows the application to be easily optimized for production and have a better performance.
* **React:** It is widely used and has a large ecosystem, making it easy to find and reuse components.
* **Tailwind CSS:** It allows you to develop quickly with pre-made styles.

### Key Libraries

*   **Radix UI:** For the accessibility and unstyled components.
*   **Zustand:** State management
*   **React Hook Form:** For form management.
*   **Lucide React:** For the icons.
*   **Class Variance Authority:** For control over style variants.

### Database

*   **None**: This project currently uses no database.

### API Integrations

*   **None**: This project currently uses no external API.

### Icons
The project is using a set of icons from the `src/components/icons.ts`: - `arrowRight`, `check`, `chevronDown`, `circle`, `workflow`, `close`, `copy`, `dark`, `edit`, `externalLink`, `file`, `help`, `home`, `light`, `loader`, `mail`, `messageSquare`, `plus`, `plusCircle`, `search`, `server`, `settings`, `share`, `shield`, `spinner`, `trash`, `user`, `dashboard`, `transactions`, `budgets`, `savings`, `categories`, `aiInsights`.

## Setup and Installation Instructions

1.  **Clone the repository:**

```bash    
git clone <repository_url>
cd <repository_directory>
```

2. **Install dependencies:**

```bash
npm install

# // for prisma
npm exec prisma generate
```

3. **Set up environment variables:**

Create a .env file in the root directory and add the necessary environment variables, such as:
```
GOOGLE_GENAI_API_KEY=<your_google_genai_api_key>
NEXTAUTH_SECRET=<your_nextauth_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```

4. **Run the development server:**

```bash
npm run dev
```

This will start the Next.js development server, and you can access the application by opening `http://localhost:9002` in your browser.

    
