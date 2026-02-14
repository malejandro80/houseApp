# Product Team Session: Application Review & Recommendations

**Participants:** PM, Copywriter, Sales Specialist, Real Estate Expert, Creative Visionary, Accountant, Lawyer.

---

### 📋 Product Manager (PM)
*   **Current State:** Solid foundation for property management and map visualization.
*   **Suggestions:**
    *   **Unified Dashboard:** Currently, the map and the table are separate. We need a "Console" view that summarizes active listings, pending assignments, and investment performance.
    *   **Onboarding Flow:** New users might be confused between "Investment Analysis" and "Listing for Sale". A guided wizard for the first property would increase retention.

### ✍️ Copywriter (Tone & Voice)
*   **Current State:** Spanish strings are functional but could be more empathetic.
*   **Suggestions:**
    *   **Emotional Hooks:** Instead of "Vender", use "Pon tu propiedad en el mapa del éxito".
    *   **Clarity:** Ensure the distinction between "Inversión" (Private) and "Venta" (Public) is explicitly explained in the UI, not just through colors.

### 📈 Sales Specialist (Growth)
*   **Current State:** Basic subscription wall.
*   **Suggestions:**
    *   **Freemium Teasers:** Show blurred "Premium Insights" (like average price/m2) on the map for logged-out users to encourage sign-up.
    *   **Referral Program:** Give a free "Premium Publication" credit for every referred user who creates an account.

### 🏠 Real Estate Expert (Domain)
*   **Current State:** Good basic metrics.
*   **Suggestions:**
    *   **Mortgage Integration:** Add a "Simular Crédito" button inside the property popup.
    *   **Neighborhood Trends:** Overlay a heatmap of demand/appreciation over the map (radar).
    *   **Advanced Filters:** Filter by "Price per m2" relative to neighborhood average.

### 🎨 Creative Visionary (Innovation)
*   **Current State:** Clean functional UI.
*   **Suggestions:**
    *   **Glassmorphism Overlays:** Update the Map UI with more translucent, premium-feeling floating cards.
    *   **AR Mobile View:** A feature where users can point their camera at a building and see if it's "Listed" or "Analyzed" (long-term vision).
    *   **Gamified ROI:** A "Investor Leaderboard" or trophies for properties with the highest confirmed ROI.

### 💸 Accountant (Financial Stability)
*   **Current State:** Simple flat subscription.
*   **Suggestions:**
    *   **Tiered Commission:** Instead of just a monthly fee, explore a "Success Fee" model for properties sold through the platform.
    *   **Advisor Payouts:** Automate the calculation of advisor commissions based on lead conversion.

### ⚖️ Lawyer (Compliance)
*   **Current State:** Basic RLS and auth.
*   **Suggestions:**
    *   **Risk Disclaimer:** Every investment analysis MUST show a popup: "Los rendimientos pasados no garantizan ganancias futuras".
    *   **Privacy Guard:** Ensure `property_owners` data is never leaked via any RPC or public view.
    *   **Digital T&C:** Require acceptance of specific Terms of Sale before a property is allowed to be `is_listed`.

---

**Next Action:** Upload this report to Notion and assign tasks to the Engineering Squad.
