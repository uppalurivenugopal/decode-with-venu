/* =====================================================================
   Microsoft Certification Path Finder — DATA
   ---------------------------------------------------------------------
   Used by src/pages/projects/microsoft-certification-path.astro, both at
   build time (the crawlable roadmap, FAQ and structured data) and in the
   browser (the interactive path finder). Edit here; both update.

   Sources (verified 31 Oct 2026):
   • Certifications, roles, prerequisites, retirements — Microsoft Learn
     certification / exam pages and the retirement schedule.
   • SKILLS — each exam's official "Study guide" on Microsoft Learn.
   • PARTNER — Microsoft Partner Center "Solutions Partner" pages.
   • VALUE — practitioner perspective, not Microsoft statements.
   Re-check every quarter: Microsoft changes certifications often.
   ===================================================================== */


/* A0. PAGE — facts used by the SEO build (keep in sync with <head>). */
const PAGE_CURATED = {
  url: "https://decodewithvenu.com/projects/microsoft-certification-path/",
  verified: "2026-10-31",              // date the catalog was last checked
  verifiedLabel: "31 October 2026",
};

/* A0b. CHANGES — 2026 retirements, from Microsoft Learn's retirement pages.
   "next" = where to go now. Where Microsoft hasn't named a direct
   replacement we say so instead of guessing.                         */
const CURATED_CHANGES = [
  { old: "MB-910 / MB-920", name: "Dynamics 365 Fundamentals (CRM / ERP)", date: "2025-12-31", next: null },
  { old: "MS-900", name: "Microsoft 365 Fundamentals", date: "2026-03-31", next: "AB-900" },
  { old: "DP-100", name: "Azure Data Scientist Associate", date: "2026-06-01", next: "AI-300" },
  { old: "AI-102", name: "Azure AI Engineer Associate", date: "2026-06-30", next: "AI-103" },
  { old: "AI-900", name: "Azure AI Fundamentals (exam only — certification continues)", date: "2026-06-30", next: "AI-901" },
  { old: "PL-600", name: "Power Platform Solution Architect Expert", date: "2026-06-30", next: null },
  { old: "PL-500", name: "Power Automate RPA Developer Associate", date: "2026-06-30", next: null },
  { old: "MB-700", name: "Dynamics 365 Finance and Operations Apps Solution Architect Expert", date: "2026-06-30", next: null },
  { old: "MB-335", name: "Dynamics 365 Supply Chain Management Functional Consultant Expert", date: "2026-06-30", next: null },
  { old: "MB-240", name: "Dynamics 365 Field Service Functional Consultant Associate", date: "2026-06-30", next: null },
  { old: "AZ-204", name: "Azure Developer Associate", date: "2026-07-31", next: "AI-200" },
  { old: "MB-280", name: "Dynamics 365 Customer Experience Analyst Associate", date: "2026-07-31", next: "AB-210" },
  { old: "AZ-500", name: "Azure Security Engineer Associate", date: "2026-08-31", next: "SC-500" },
  { old: "PL-200", name: "Power Platform Functional Consultant Associate", date: "2026-08-31", next: "AB-410" },
  { old: "AZ-800 / AZ-801", name: "Windows Server Hybrid Administrator (exams only — certification continues)", date: "2026-09-30", next: "AZ-802" },
  { old: "PL-400", name: "Power Platform Developer (exam only — certification continues)", date: "2026-10-30", next: "AB-400" },
  { old: "MS-102", name: "Microsoft 365 Administrator Expert", date: "2026-11-30", next: "AB-650", upcoming: true },
];

/* A0c. FAQ — shown on the page and in FAQPage structured data. */
export const FAQ = [
  { q: "Which Microsoft certification should I start with?",
    a: "Start with the fundamentals exam for the area you want to work in — AZ-900 for Azure, AI-901 for AI, DP-900 for data, SC-900 for security, PL-900 for Power Platform, AB-900 for Microsoft 365 and Copilot administration, or GH-900 for GitHub. If you already have hands-on experience, you can go straight to the associate certification; fundamentals are not prerequisites for role-based certifications." },
  { q: "What replaced AZ-204, AI-102 and AZ-500?",
    a: "AZ-204 (retired 31 July 2026) points to AI-200 Azure AI Cloud Developer Associate. AI-102 (retired 30 June 2026) points to AI-103 Azure AI Apps and Agents Developer Associate. AZ-500 (retired 31 August 2026) points to SC-500 Cloud and AI Security Engineer Associate." },
  { q: "What replaced the Power Platform certifications PL-200, PL-400 and PL-600?",
    a: "PL-200 retired on 31 August 2026; the closest current certification is AB-410 Intelligent Applications Builder Associate. The PL-400 exam was replaced by AB-400, which still earns Power Platform Developer Associate. PL-600 retired on 30 June 2026 with no direct replacement; AB-100 Agentic AI Business Solutions Architect is the current expert-level business-applications certification." },
  { q: "Is MS-102 Microsoft 365 Administrator Expert retiring?",
    a: "Yes. Exam MS-102 retires on 30 November 2026. After that date the certification can no longer be earned. AB-650 Microsoft 365 and AI Services Administrator Associate covers Microsoft 365 administration with Copilot and agents." },
  { q: "Do Microsoft certifications expire?",
    a: "Microsoft associate, expert and specialty certifications expire every 12 months and can be renewed free of charge by passing an online renewal assessment on Microsoft Learn. Fundamentals certifications do not expire." },
  { q: "How do I book a Microsoft certification exam?",
    a: "Open the certification or exam page on Microsoft Learn and choose Schedule exam. Exams are delivered by Pearson VUE, online or at a test centre, and the price depends on the country where you take the exam." },
  { q: "Which Microsoft certifications count toward Solutions Partner designations?",
    a: "Microsoft's Solutions Partner designations for Data & AI, Infrastructure, Digital & App Innovation, Business Applications, Modern Work and Security each list eligible certifications. Some, such as AZ-104 and AZ-305 for the Azure designations, are required steps; others earn points. Each certification in the roadmap below shows where it counts." },
  { q: "Is there an up-to-date Microsoft certification poster?",
    a: "Microsoft publishes a certification poster as a PDF on Microsoft Learn. This page is an interactive alternative: it lists every active certification as of the date shown at the top of the roadmap, flags retirements, and links straight to each official learning path and exam page." },
];

/* A1. CERTS — one entry per exam.
     code    exam code
     name    certification earned (Microsoft's wording, without the
             "Microsoft Certified:" prefix)
     level   Fundamentals | Associate | Expert | Specialty | Business | GitHub
     domain  area key (see DOMAINS)
     page    path of the official page after .../credentials/certifications/
             (this page has the "Schedule exam" button). null = no page yet.
     roles   job roles Microsoft tags the certification with (if listed)
     renew   true if Microsoft lists a 12-month renewal
     prereq  certification(s) required before this one is awarded
     retire  scheduled retirement date "YYYY-MM-DD"
     note    any other fact worth flagging
     course  false if Microsoft has no "XXNNNT00" course page          */
const CURATED_CERTS = [
  // ---- Azure infrastructure ----
  { code: "AZ-900", name: "Azure Fundamentals", level: "Fundamentals", domain: "azure", page: "azure-fundamentals/", roles: "Administrator" },
  { code: "AZ-104", name: "Azure Administrator Associate", level: "Associate", domain: "azure", page: "azure-administrator/", roles: "Administrator", renew: true },
  { code: "AZ-700", name: "Azure Network Engineer Associate", level: "Associate", domain: "azure", page: "azure-network-engineer-associate/", roles: "Network Engineer", renew: true },
  { code: "AZ-802", name: "Windows Server Hybrid Administrator Associate", level: "Associate", domain: "azure", page: "exams/az-802/",
    note: "AZ-802 is the single exam that replaced AZ-800 + AZ-801 (retired 30 Sep 2026). Microsoft has announced the certification is being renamed Windows Server Administrator Associate." },
  { code: "AZ-305", name: "Azure Solutions Architect Expert", level: "Expert", domain: "azure", page: "exams/az-305/",
    prereq: "Azure Administrator Associate (AZ-104)" },
  { code: "AZ-400", name: "DevOps Engineer Expert", level: "Expert", domain: "azure", page: "exams/az-400/",
    prereq: "Azure Administrator Associate (AZ-104) — or Azure Developer Associate if you already hold it (AZ-204 retired 31 Jul 2026)" },
  { code: "AZ-401", name: "Agentic DevOps Engineer Expert", level: "Expert", domain: "azure", page: "agentic-devops-engineer-expert/", roles: "DevOps Engineer, Developer, Platform Engineer, Solution Architect", beta: true,
    note: "New in Oct 2026 and in beta: the DevOps expert track rebuilt around Azure DevOps, GitHub Actions and AI agents. Microsoft's page doesn't list a prerequisite yet — check it before booking." },
  { code: "AZ-120", name: "Azure for SAP Workloads Specialty", level: "Specialty", domain: "azure", page: "azure-for-sap-workloads-specialty/", roles: "Solution Architect", renew: true },
  { code: "AZ-140", name: "Azure Virtual Desktop Specialty", level: "Specialty", domain: "azure", page: "azure-virtual-desktop-specialty/", roles: "Administrator", renew: true },

  // ---- AI & app development ----
  { code: "AI-901", name: "Azure AI Fundamentals", level: "Fundamentals", domain: "ai", page: "exams/ai-901/",
    note: "AI-901 replaced the AI-900 exam on 30 Jun 2026; the certification name stays the same." },
  { code: "AI-103", name: "Azure AI Apps and Agents Developer Associate", level: "Associate", domain: "ai", page: "azure-ai-apps-and-agents-developer-associate/", roles: "AI Engineer, Developer",
    note: "Successor to the retired AI-102 (Azure AI Engineer)." },
  { code: "AI-200", name: "Azure AI Cloud Developer Associate", level: "Associate", domain: "ai", page: "azure-ai-cloud-developer-associate/", roles: "Developer",
    note: "Successor to the retired AZ-204 (Azure Developer)." },
  { code: "AI-300", name: "Machine Learning Operations Engineer Associate", level: "Associate", domain: "ai", page: "operationalizing-machine-learning-and-generative-ai-solutions/", roles: "AI Engineer",
    note: "Successor to the retired DP-100 (Azure Data Scientist)." },
  { code: "AI-500", name: "Multi-Agent AI Solutions Expert", level: "Expert", domain: "ai", page: "exams/ai-500/", roles: "AI Engineer, Developer, Solution Architect",
    prereq: "Azure AI Apps and Agents Developer Associate (AI-103)" },

  // ---- Data & analytics ----
  { code: "DP-900", name: "Azure Data Fundamentals", level: "Fundamentals", domain: "data", page: "azure-data-fundamentals/", roles: "Data Engineer" },
  { code: "PL-300", name: "Power BI Data Analyst Associate", level: "Associate", domain: "data", page: "data-analyst-associate/", roles: "Data Analyst", renew: true },
  { code: "DP-600", name: "Fabric Analytics Engineer Associate", level: "Associate", domain: "data", page: "fabric-analytics-engineer-associate/", roles: "Data Engineer, Data Analyst", renew: true },
  { code: "DP-700", name: "Fabric Data Engineer Associate", level: "Associate", domain: "data", page: "fabric-data-engineer-associate/", roles: "Data Engineer" },
  { code: "DP-750", name: "Azure Databricks Data Engineer Associate", level: "Associate", domain: "data", page: null,
    note: "Microsoft Learn has the official study guide for DP-750 but no certification page yet — check the study guide for when booking opens." },
  { code: "DP-300", name: "Azure Database Administrator Associate", level: "Associate", domain: "data", page: "azure-database-administrator-associate/", roles: "Database Administrator", renew: true },
  { code: "DP-800", name: "SQL AI Developer Associate", level: "Associate", domain: "data", page: null,
    note: "Microsoft Learn has the official study guide for DP-800 but no certification page yet — check the study guide for when booking opens." },
  { code: "DP-420", name: "Azure Cosmos DB AI Developer Associate", level: "Associate", domain: "data", page: "azure-cosmos-db-developer-specialty/", roles: "Developer", renew: true,
    note: "Formerly the Azure Cosmos DB Developer Specialty; Microsoft now positions it as an Associate-level AI developer certification." },

  // ---- Security ----
  { code: "SC-900", name: "Security, Compliance, and Identity Fundamentals", level: "Fundamentals", domain: "security", page: "security-compliance-and-identity-fundamentals/", roles: "Security Engineer" },
  { code: "SC-200", name: "Security Operations Analyst Associate", level: "Associate", domain: "security", page: "security-operations-analyst/", roles: "Security Operations Analyst", renew: true },
  { code: "SC-300", name: "Identity and Access Administrator Associate", level: "Associate", domain: "security", page: "identity-and-access-administrator/", roles: "Security Engineer", renew: true },
  { code: "SC-401", name: "Information Security Administrator Associate", level: "Associate", domain: "security", page: "information-security-administrator/", roles: "Administrator" },
  { code: "SC-500", name: "Cloud and AI Security Engineer Associate", level: "Associate", domain: "security", page: "cloud-and-ai-security-engineer-associate/",
    note: "Successor to the retired AZ-500 (Azure Security Engineer)." },
  { code: "SC-100", name: "Cybersecurity Architect Expert", level: "Expert", domain: "security", page: "exams/sc-100/",
    prereq: "one of: Identity and Access Administrator (SC-300), Security Operations Analyst (SC-200) or Cloud and AI Security Engineer (SC-500) Associate" },

  // ---- Microsoft 365 & Copilot administration ----
  { code: "AB-900", name: "Copilot and Agent Administration Fundamentals", level: "Fundamentals", domain: "m365", page: "copilot-and-agent-administration-fundamentals/", roles: "Administrator",
    note: "Replaces the retired MS-900 (Microsoft 365 Fundamentals)." },
  { code: "MD-102", name: "Endpoint Administrator Associate", level: "Associate", domain: "m365", page: "modern-desktop/", roles: "Administrator", renew: true },
  { code: "MS-700", name: "Teams Administrator Associate", level: "Associate", domain: "m365", page: "m365-teams-administrator-associate/", roles: "Administrator", renew: true },
  { code: "MS-721", name: "Collaboration Communications Systems Engineer Associate", level: "Associate", domain: "m365", page: "m365-collaboration-communications-systems-engineer/", roles: "Administrator", renew: true },
  { code: "AB-650", name: "Microsoft 365 and AI Services Administrator Associate", level: "Associate", domain: "m365", page: "exams/ab-650/",
    note: "The recommended next step for Microsoft 365 administrators as MS-102 retires." },
  { code: "MS-102", name: "Microsoft 365 Administrator Expert", level: "Expert", domain: "m365", page: "exams/ms-102/", retire: "2026-11-30",
    prereq: "one of: Endpoint Administrator (MD-102), Teams Administrator (MS-700) or Identity and Access Administrator (SC-300) Associate",
    note: "If you can't sit the exam before it closes, aim for AB-650 (Microsoft 365 and AI Services Administrator Associate)." },

  // ---- Power Platform & agents ----
  { code: "PL-900", name: "Power Platform Fundamentals", level: "Fundamentals", domain: "power", page: "power-platform-fundamentals/", roles: "App Maker" },
  { code: "AB-410", name: "Intelligent Applications Builder Associate", level: "Associate", domain: "power", page: "intelligent-applications-builder-associate/",
    note: "Successor to the retired PL-200 (Power Platform Functional Consultant)." },
  { code: "AB-620", name: "AI Agent Builder Associate", level: "Associate", domain: "power", page: "ai-agent-builder-associate/" },
  { code: "AB-400", name: "Power Platform Developer Associate", level: "Associate", domain: "power", page: "exams/ab-400/",
    note: "Exam AB-400 replaced PL-400; the certification you earn is unchanged." },
  { code: "AB-100", name: "Agentic AI Business Solutions Architect", level: "Expert", domain: "power", page: "exams/ab-100/",
    prereq: "one Associate from Microsoft's list — e.g. AB-410, AB-620, AB-400, AB-210, AB-250, MB-230, MB-310, MB-330, MB-500, MB-800, MB-820, AI-103 or AI-300",
    note: "Microsoft's expert path after PL-600 and the Dynamics 365 architect exams retired." },

  // ---- Dynamics 365 ----
  { code: "AB-210", name: "Dynamics 365 Sales AI Consultant Associate", level: "Associate", domain: "d365", page: "d365-sales-ai-consultant-associate/", roles: "Business Analyst, Functional Consultant",
    note: "Successor to the retired MB-280 (Customer Experience Analyst)." },
  { code: "MB-230", name: "Dynamics 365 Customer Service Functional Consultant Associate", level: "Associate", domain: "d365", page: "exams/mb-230/", course: false },
  { code: "AB-250", name: "Dynamics 365 Contact Center AI Engineer Associate", level: "Associate", domain: "d365", page: "d365-contact-center-ai-engineer-associate/", roles: "Administrator, Business Analyst, Functional Consultant, Platform Engineer" },
  { code: "MB-310", name: "Dynamics 365 Finance Functional Consultant Associate", level: "Associate", domain: "d365", page: "d365-functional-consultant-financials/", roles: "Functional Consultant", renew: true },
  { code: "MB-330", name: "Dynamics 365 Supply Chain Management Functional Consultant Associate", level: "Associate", domain: "d365", page: "d365-functional-consultant-supply-chain-management/", roles: "Functional Consultant", renew: true },
  { code: "AB-330", name: "Supply Chain Management AI Consultant Associate", level: "Associate", domain: "d365", page: "supply-chain-management-ai-consultant-associate/", roles: "Functional Consultant", beta: true, course: false,
    note: "New in Oct 2026 and in beta: Dynamics 365 Supply Chain Management organised around Microsoft's business process catalogue (source to pay, order to cash, inventory to deliver) with AI capabilities." },
  { code: "MB-500", name: "Dynamics 365: Finance and Operations Apps Developer Associate", level: "Associate", domain: "d365", page: "d365-finance-and-operations-apps-developer-associate/", roles: "Developer", renew: true },
  { code: "MB-800", name: "Dynamics 365 Business Central Functional Consultant Associate", level: "Associate", domain: "d365", page: "d365-business-central-functional-consultant-associate/", roles: "Functional Consultant", renew: true },
  { code: "MB-820", name: "Dynamics 365 Business Central Developer Associate", level: "Associate", domain: "d365", page: "d365-business-central-developer-associate/", roles: "Developer, Solution Architect", renew: true },

  // ---- GitHub ----
  { code: "GH-900", name: "GitHub Foundations", level: "GitHub", domain: "github", page: "github-foundations/" },
  { code: "GH-300", name: "GitHub Copilot", level: "GitHub", domain: "github", page: "github-copilot/" },
  { code: "GH-200", name: "GitHub Actions", level: "GitHub", domain: "github", page: "github-actions/" },
  { code: "GH-100", name: "GitHub Administration", level: "GitHub", domain: "github", page: "github-administration/" },
  { code: "GH-500", name: "GitHub Advanced Security", level: "GitHub", domain: "github", page: "github-advanced-security/" },
  { code: "GH-600", name: "GitHub Certified: Agentic AI Developer", level: "GitHub", domain: "github", page: "agentic-ai-developer/", course: false },
  { code: "GH-700", name: "GitHub Certified: Agentic AI Business Professional", level: "GitHub", domain: "github", page: "agentic-ai-business-professional/", roles: "Business Analyst, Business Leader, Business User, Functional Consultant, Technology Manager", beta: true, course: false,
    note: "New in Oct 2026 and in beta: GitHub and GitHub Copilot for product managers, programme managers and business analysts — no coding background needed." },

  // ---- AI for business professionals ----
  { code: "AB-730", name: "AI Business Professional", level: "Business", domain: "aibiz", page: "ai-business-professional/", roles: "Business User, Administrator" },
  { code: "AB-731", name: "AI Transformation Leader", level: "Business", domain: "aibiz", page: "ai-transformation-leader/", roles: "Business Leader" },
];

/* A2. SKILLS — copied from each exam's official study guide on Microsoft Learn
   ("Skills at a glance" + the sub-skill headings). Format per exam:
     [ domain name, "weight range %", [ sub-skills ] ]
   An empty sub-skill list means the study guide didn't break that domain
   down with headings — we leave it empty rather than invent anything.   */
const CURATED_SKILLS = {
  "AZ-900": [["Describe cloud concepts","25–30",["Describe cloud computing","Describe the benefits of using cloud services","Describe cloud service types"]],["Describe Azure architecture and services","35–40",["Describe the core architectural components of Azure","Describe Azure compute and networking services","Describe Azure storage services","Describe Azure identity, access, and security"]],["Describe Azure management and governance","30–35",["Describe cost management in Azure","Describe features and tools in Azure for governance and compliance","Describe features and tools for managing and deploying Azure resources","Describe monitoring tools in Azure"]]],
  "AZ-104": [["Manage Azure identities and governance","20–25",["Manage Microsoft Entra users and groups","Manage access to Azure resources","Manage Azure subscriptions and governance"]],["Implement and manage storage","15–20",["Configure access to storage","Configure and manage storage accounts","Configure Azure Files and Azure Blob Storage"]],["Deploy and manage Azure compute resources","20–25",["Automate deployment of resources by using ARM templates or Bicep files","Create and configure virtual machines","Provision and manage containers in the Azure portal","Create and configure Azure App Service"]],["Implement and manage virtual networking","15–20",["Configure and manage virtual networks in Azure","Configure secure access to virtual networks","Configure name resolution and load balancing"]],["Monitor and maintain Azure resources","10–15",["Monitor resources in Azure","Implement backup and recovery"]]],
  "AZ-700": [["Design and implement core networking infrastructure","25–30",["Design and implement IP addressing for Azure resources","Design and implement name resolution","Design and implement VNet connectivity and routing","Monitor networks"]],["Design, implement, and manage connectivity services","20–25",["Site-to-site VPN connections","Point-to-site VPN connections","Azure ExpressRoute","Azure Virtual WAN architecture"]],["Design and implement application delivery services","15–20",["Azure Load Balancer and Azure Traffic Manager","Azure Application Gateway","Azure Front Door"]],["Design and implement private access to Azure services","10–15",["Azure Private Link service and private endpoints","Service endpoints"]],["Design and implement Azure network security services","15–20",["Network security groups","Azure Firewall and Azure Firewall Manager","Web Application Firewall (WAF) deployment"]]],
  "AZ-802": [["Deploy and manage AD DS","20–25",["Deploy and manage AD DS domain controllers","Configure multi-site, multi-domain, and multi-forest environments","Create and manage AD DS security principals","Manage Windows Server by using domain-based Group Policies"]],["Manage Windows Server instances and workloads in a hybrid environment","10–15",["Configure remote management in a hybrid environment","Manage instances and workloads by using Azure services"]],["Manage virtual machines","10–15",[]],["Implement and manage an on-premises and hybrid networking infrastructure","10–15",["Implement on-premises and hybrid name resolution","Manage IP addressing in on-premises and hybrid scenarios"]],["Manage storage and file services","15–20",["Configure and manage Azure Files","Configure and manage Windows Server file shares","Configure Windows Server storage"]],["Secure Windows Server infrastructure","10–15",["Secure Windows Server operating system","Secure AD DS"]],["Monitor and troubleshoot Windows Server environments","15–20",["Monitor by using Windows Server tools and Azure services","Troubleshoot Windows Server issues","Troubleshoot Active Directory"]]],
  "AZ-305": [["Design identity, governance, and monitoring solutions","25–30",["Design solutions for logging and monitoring","Design authentication and authorization solutions","Design governance"]],["Design data storage solutions","20–25",["Relational data","Semi-structured and unstructured data","Data integration"]],["Design business continuity solutions","15–20",["Backup and disaster recovery","High availability"]],["Design infrastructure solutions","30–35",["Design compute solutions","Design an application architecture","Design migrations","Design network solutions"]]],
  "AZ-400": [["Design and implement processes and communications","10–15",["Traceability and flow of work","Metrics and queries for DevOps","Collaboration and communication"]],["Design and implement a source control strategy","10–15",["Branching strategies for the source code","Configure and manage repositories"]],["Design and implement build and release pipelines","50–55",["Package management strategy","Testing strategy for pipelines","Design and implement pipelines","Design and implement deployments","Infrastructure as code (IaC)","Maintain pipelines"]],["Develop a security and compliance plan","10–15",["Authentication and authorization methods","Managing sensitive information in automation","Automate security and compliance scanning"]],["Implement an instrumentation strategy","5–10",["Configure monitoring for a DevOps environment","Analyze metrics from instrumentation"]]],
  "AZ-120": [["Migrate SAP workloads to Azure","25–30",["Identify requirements for target infrastructure","Design and implement an Azure environment to support SAP workloads","Design and implement integration with SAP RISE"]],["Design and implement an infrastructure to support SAP workloads on Azure","25–30",["Compute for SAP workloads","Networking for SAP on Azure VMs","Storage for SAP on Azure VMs"]],["Design and implement high availability and disaster recovery (HADR)","20–25",["High availability for SAP on Azure VMs","Disaster recovery for SAP on Azure VMs"]],["Maintain SAP workloads on Azure","20–25",["Optimize performance and costs","Monitor and maintain SAP on Azure"]]],
  "AZ-140": [["Plan and implement an Azure Virtual Desktop infrastructure","40–45",["Networking for Azure Virtual Desktop","Storage for user data","Plan host pools and session hosts","Implement host pools and session hosts","Create and manage session host images"]],["Plan and implement identity and security","15–20",["Identity integration","Security"]],["Plan and implement user environments and apps","20–25",["FSLogix","User experience and client settings","Install and configure apps on a session host"]],["Monitor and maintain an Azure Virtual Desktop infrastructure","10–15",["Monitor and manage Azure Virtual Desktop services","Updates, backups, and disaster recovery"]]],
  "AI-901": [["Identify AI concepts and capabilities","40–45",["Describe principles of responsible AI","Identify AI model components and configurations","Identify AI workloads"]],["Implement AI solutions by using Microsoft Foundry","55–60",["Generative AI apps and agents by using Foundry","AI solutions for text and speech","Computer vision and image-generation solutions","Information extraction solutions"]]],
  "AI-103": [["Plan and manage an Azure AI solution","25–30",["Choose Foundry services for generative AI and agents","Set up AI solutions in Foundry","Manage, monitor, and secure AI systems","Implement responsible AI across generative and agentic systems"]],["Implement generative AI and agentic solutions","30–35",["Build generative applications by using Foundry","Build agents by using Foundry","Optimize and operationalize generative AI systems"]],["Implement computer vision solutions","10–15",["Image- and video-generation solutions","Multimodal understanding workflows","Responsible AI for multimodal content"]],["Implement text analysis solutions","10–15",["Apply language model text analysis","Implement speech solutions"]],["Implement information extraction solutions","10–15",["Build retrieval and grounding pipelines","Extract content from documents"]]],
  "AI-200": [["Develop containerized solutions on Azure","20–25",["Container application hosting","Container-orchestrated solutions"]],["Develop AI solutions by using Azure data management services","25–30",["Azure Cosmos DB for NoSQL","Azure Database for PostgreSQL","Azure Managed Redis in AI solutions"]],["Connect to and consume Azure services","20–25",["Event- and message-based AI solutions","Azure Functions"]],["Secure, monitor, troubleshoot Azure solutions","20–25",[]]],
  "AI-300": [["Design and implement an MLOps infrastructure","15–20",["Resources in a Machine Learning workspace","Assets in a Machine Learning workspace","IaC for Machine Learning"]],["Implement machine learning model lifecycle and operations","25–30",["Orchestrate model training","Model registration and versioning","Deploy models for production","Monitor and maintain models in production"]],["Design and implement a GenAIOps infrastructure","20–25",["Foundry environments and platform configuration","Deploy and manage foundation models","Prompt versioning with source control"]],["Implement generative AI quality assurance and observability","10–15",["Evaluation and validation for generative AI apps and agents","Observability for generative AI apps and agents"]],["Optimize generative AI systems and model performance","10–15",["Optimize RAG performance and accuracy","Advanced fine-tuning and model customization"]]],
  "AI-500": [["Architect multi-agent solutions","15–20",["Logical architecture for multi-agent solutions","Technology components for a multi-agent solution"]],["Develop multi-agent solutions in Azure","30–35",["Advanced prompt engineering strategies","Agent memory, context management, and knowledge integration","Build and integrate tool ecosystems","Multi-agent orchestration"]],["Evaluate, optimize, and monitor multi-agent solutions","20–25",["Evaluation and validation strategies","Optimize prompt and model performance","Observability and monitoring"]],["Secure, govern, and deploy multi-agent solutions","20–25",["Security for multi-agent solutions","Guardrails for multi-agent solutions","Deploy multi-agent solutions to Azure"]]],
  "DP-900": [["Describe core data concepts","25–30",["Ways to represent data","Options for data storage","Common data workloads","Roles and responsibilities for data workloads"]],["Identify considerations for relational data on Azure","20–25",["Relational concepts","Relational Azure data services"]],["Describe considerations for working with non-relational data on Azure","15–20",["Capabilities of Azure storage","Capabilities and features of Azure Cosmos DB"]],["Describe an analytics workload on Azure","25–30",[]]],
  "PL-300": [["Prepare the data","25–30",["Get or connect to data","Profile and clean the data","Transform and load the data"]],["Model the data","25–30",["Design and implement a data model","Create model calculations by using DAX","Optimize model performance"]],["Visualize and analyze the data","25–30",["Create reports","Enhance reports for usability and storytelling","Identify patterns and trends"]],["Manage and secure Power BI","15–20",["Create and manage workspaces and assets","Secure and govern Power BI items"]]],
  "DP-600": [["Plan, implement, and manage a solution for data analytics","10–15",["Plan a data analytics environment","Implement and manage a data analytics environment","Manage the analytics development lifecycle"]],["Prepare and serve data","40–45",["Create objects in a lakehouse or warehouse","Copy data","Transform data","Optimize performance"]],["Implement and manage semantic models","20–25",["Design and build semantic models","Optimize enterprise-scale semantic models"]],["Explore and analyze data","20–25",["Perform exploratory analytics","Query data by using SQL"]]],
  "DP-700": [["Implement and manage an analytics solution","30–35",["Configure Fabric workspace settings","Lifecycle management in Fabric","Security and governance","Orchestrate processes"]],["Ingest and transform data","30–35",["Design and implement loading patterns","Ingest and transform batch data","Ingest and transform streaming data"]],["Monitor and optimize an analytics solution","30–35",["Monitor Fabric items","Identify and resolve errors","Optimize performance"]]],
  "DP-750": [["Set up and configure an Azure Databricks environment","15–20",["Select and configure compute in a workspace","Create and organize objects in Unity Catalog"]],["Secure and govern Unity Catalog objects","15–20",["Secure Unity Catalog objects","Govern Unity Catalog objects"]],["Prepare and process data","30–35",["Data modeling in Unity Catalog","Ingest data into Unity Catalog","Cleanse, transform, and load data","Data quality constraints"]],["Deploy and maintain data pipelines and workloads","30–35",["Design and implement data pipelines","Implement Lakeflow Jobs","Development lifecycle processes in Azure Databricks","Monitor, troubleshoot, and optimize workloads"]]],
  "DP-300": [["Plan and implement data platform resources","15–20",["Plan and deploy Azure SQL solutions","Configure resources for scale and performance","Plan and implement a migration strategy"]],["Implement a secure environment","20–25",["Database authentication and authorization","Security for data at rest and in transit","Compliance controls for sensitive data"]],["Monitor, configure, and optimize database resources","20–25",["Monitor resource activity and performance","Monitor and optimize query performance","Configure for optimal performance"]],["Configure and manage automation of tasks","15–20",["SQL Server Agent jobs","Automate deployment of database resources","Database tasks in Azure"]],["Plan and configure a high availability and disaster recovery (HA/DR) environment","20–25",["HA/DR strategy","Backup and restore","Configure HA/DR"]]],
  "DP-800": [["Design and develop database solutions","35–40",["Design and implement database objects","Implement programmability objects","Write advanced T-SQL code","SQL solutions using AI-assisted tools"]],["Secure, optimize, and deploy database solutions","35–40",["Data security and compliance","Optimize database performance","CI/CD by using SQL Database Projects","Integrate SQL solutions with Azure services"]],["Implement AI capabilities in database solutions","25–30",["Models and embeddings","Intelligent search","Retrieval-augmented generation (RAG)"]]],
  "DP-420": [["Design and develop database solutions","40–45",["Evaluate resource models and SDK solutions","Implement database operations","Data models and partitioning strategies","Implement change feed","Cosmos DB solutions using AI-assisted tools"]],["Secure, optimize, and deploy database solutions","30–35",["Database security controls","Availability and recovery solutions","Optimize and remediate performance","Fleet management across accounts and subscriptions"]],["Implement AI and Analytics capabilities in database solutions","20–25",[]]],
  "SC-900": [["Describe the concepts of security, compliance, and identity","10–15",["Security and compliance concepts","Identity concepts"]],["Describe the capabilities of Microsoft Entra","25–30",["Function and identity types of Microsoft Entra ID","Authentication capabilities","Access management capabilities","Identity protection and governance"]],["Describe the capabilities of Microsoft security solutions","35–40",["Core infrastructure security services in Azure","Security management capabilities of Azure","Microsoft Sentinel","Threat protection with Microsoft Defender XDR"]],["Describe the capabilities of Microsoft compliance solutions","20–25",["Service Trust Portal and privacy principles","Compliance management in Microsoft Purview","Information protection, data lifecycle and governance","Insider risk, eDiscovery, and audit"]]],
  "SC-200": [["Manage a security operations environment","40–45",["Automation for Defender XDR and Microsoft Sentinel","Configure the Microsoft Sentinel SIEM and platform","Ingest data into Microsoft Sentinel","Configure detections"]],["Respond to security incidents","35–40",["Alerts and incidents in Microsoft Defender XDR","Alerts and incidents in Defender for Endpoint","Investigate Microsoft 365 activities"]],["Perform threat hunting","20–25",["Detect threats by using Defender XDR","Detect threats by using Microsoft Sentinel"]]],
  "SC-300": [["Implement and manage user identities","20–25",["Configure and manage a Microsoft Entra tenant","Create and manage Microsoft Entra identities","External users and tenants","Hybrid identity"]],["Implement authentication and access management","25–30",["User authentication","Conditional Access","Microsoft Entra ID Protection","Global Secure Access"]],["Plan and implement workload identities","20–25",["Identities for applications and Azure workloads","Enterprise application integration","App registrations","App access with Defender for Cloud Apps"]],["Plan and automate identity governance","20–25",["Entitlement management","Access reviews","Privileged access","Monitor identity activity"]]],
  "SC-401": [["Implement information protection","30–35",["Data classification","Sensitivity labels in Microsoft Purview","Information protection for Windows, file shares, and Exchange"]],["Implement data loss prevention and retention","30–35",["Data loss prevention policies","Microsoft Purview Endpoint DLP","Retention"]],["Manage risks, alerts, and activities","30–35",["Microsoft Purview Insider Risk Management","Information security alerts and activities","Protect data used by AI services"]]],
  "SC-500": [["Manage identity, access, and governance","20–25",["Secure access with Microsoft Entra ID","Secrets and keys with Azure Key Vault","Governance for security and regulatory compliance"]],["Secure storage, databases, and networking","25–30",["Security for storage accounts","Security for databases","Security for Azure network services"]],["Secure compute","20–25",["Security for AI","Security for servers and virtual machines","Security for application platform services"]],["Manage and monitor security posture","20–25",["Security posture with Defender for Cloud","Event collection in Microsoft Sentinel","Microsoft Security Copilot"]]],
  "SC-100": [["Design solutions that align with security best practices and priorities","20–25",["Resiliency strategy for ransomware and other attacks","Align with MCRA and the Microsoft Cloud Security Benchmark","Align with the Cloud Adoption Framework and Well-Architected Framework"]],["Design security operations, identity, and compliance capabilities","25–30",["Security operations","Identity and access management","Securing privileged access","Regulatory compliance"]],["Design security solutions for infrastructure","25–30",["Security posture in hybrid and multicloud","Securing server and client endpoints","Securing SaaS, PaaS, and IaaS","Network security and Security Service Edge (SSE)"]],["Design security solutions for applications and data","20–25",["Securing Microsoft 365","Securing applications","Securing an organization's data"]]],
  "AB-900": [["Identify the core features and objects of Microsoft 365 services","30–35",["Core objects of Microsoft 365 services","Microsoft 365 security principles","Core security features of Microsoft 365"]],["Understand data protection and governance tasks for Microsoft 365 and Copilot","35–40",["Microsoft Purview","Data security implications of Copilot","Data protection and governance risks","Identify and monitor oversharing in SharePoint"]],["Perform basic administrative tasks for Copilot and agents","25–30",["Features and capabilities of Copilot and agents","Basic administration for Copilot","Basic administration for agents"]]],
  "MD-102": [["Prepare infrastructure for devices","20–25",["Add devices to Microsoft Entra ID","Enroll devices to Microsoft Intune","Implement identity and compliance"]],["Manage and maintain devices","25–30",["Deploy and upgrade Windows clients with cloud tools","Device configuration profiles","Intune Suite add-on capabilities","Remote actions on devices"]],["Protect devices","15–20",["Configure endpoint security","Manage device updates"]],["Manage and secure applications","15–20",["Deploy and update apps","App protection and app configuration policies"]],["Optimize endpoint operations by using automation, monitoring, and reporting","10–15",["Automate management tasks","Monitor and optimize health"]]],
  "MS-700": [["Configure and manage a Teams environment","40–45",["Network settings for Teams","Security and compliance settings","Governance for Teams","External collaboration","Teams clients and devices"]],["Manage teams, channels, chats, and apps","20–25",["Create and manage teams","Manage channels and chats","Manage apps for Teams"]],["Manage meetings and calling","15–20",["Meetings and events","Phone numbers and services for Teams Phone"]],["Monitor, report on, and troubleshoot Teams","15–20",["Monitor and report on Teams","Troubleshoot audio, video, and client issues"]]],
  "MS-721": [["Plan and design collaboration communications systems","20–25",["Plan Teams meetings","Plan Teams Phone and PSTN connectivity","Plan Teams-certified device solutions","Prepare the network for Teams"]],["Configure and manage Teams meetings, webinars, and town halls","15–20",["Teams meetings","Audio Conferencing","Teams webinars","Teams town halls"]],["Configure and manage Teams Phone","30–35",[]],["Configure and manage Teams Rooms and devices","20–25",["Maintain Teams Rooms and devices","Teams Android devices","Teams Rooms on Windows","Optional features for Teams Rooms","BYOD spaces and bookable desks"]]],
  "AB-650": [["Configure and manage Microsoft 365 tenants and workloads","20–25",["Configure and manage a Microsoft 365 tenant","Manage Microsoft 365 workloads"]],["Govern and secure Microsoft 365 tenants and workloads","40–45",["Identities in Microsoft Entra","Authentication and access in Microsoft Entra","Secure Microsoft 365 workloads","Protect data with Microsoft Purview"]],["Manage and secure AI services in Microsoft 365","35–40",["Enable and manage Microsoft 365 Copilot","Agents in Microsoft 365 and Agent 365","Secure and govern agents by using Agent 365","Monitor AI services in Microsoft 365"]]],
  "MS-102": [["Deploy and manage a Microsoft 365 tenant","25–30",["Implement and manage a Microsoft 365 tenant","Manage users and groups","Manage roles and role groups"]],["Implement and manage Microsoft Entra identity and access","25–30",["Identity synchronization","Authentication","Secure access"]],["Manage security and threats by using Microsoft Defender XDR","30–35",["Defender XDR reports and alerts","Defender for Office 365","Defender for Endpoint","Defender for Cloud Apps"]],["Manage compliance by using Microsoft Purview","10–15",["Information protection and data lifecycle management","Data loss prevention (DLP)"]]],
  "PL-900": [["Describe the business value of Microsoft Power Platform","5–10",["Business value of Power Platform services"]],["Manage the Microsoft Power Platform environment","20–25",["Microsoft Dataverse","Administration and governance"]],["Demonstrate the capabilities of Power Apps","20–25",["Power Apps capabilities and use cases","Build basic apps"]],["Demonstrate the capabilities of Power Automate","20–25",["Power Automate use cases and capabilities","Build basic flows"]],["Describe features and capabilities of agents in Microsoft Copilot Studio","20–25",["Build agents in Copilot Studio","Manage agents in Copilot Studio"]]],
  "AB-410": [["Create a foundation for intelligent applications","25–30",["Design Power Platform solutions by using AI-enabled tools","Build data models"]],["Create intelligent applications","25–30",["Create model-driven apps","Create canvas apps"]],["Build business application logic and automation","40–45",["Create cloud flows","Create prompts and models in AI Hub","Implement business and process logic"]]],
  "AB-620": [["Plan and configure agent solutions","30–35",["Plan an agent solution","Create and monitor agent flows in Copilot Studio","Configure topics"]],["Integrate and extend agents in Copilot Studio","40–45",["Connect to enterprise knowledge sources","Add tools to agents","Multi-agent collaboration from Copilot Studio","Integrate agents with Azure"]],["Test and manage agents","20–25",["Evaluate agent performance","Application lifecycle management (ALM) for agents"]]],
  "AB-400": [["Build Microsoft Power Platform solutions","15–20",["Design the technical architecture","Design solution components","Application lifecycle management (ALM)"]],["Extend the user experience","25–30",["Client scripting in model-driven apps","PCF code components","Build Power Apps code apps","Deploy and manage code apps"]],["Extend Microsoft Power Platform","35–40",["Dataverse plug-ins","Platform APIs","Azure Functions workloads","Power Automate cloud flows and Copilot Studio workflows","Foundry agents integrated with Power Platform"]],["Develop integrations","10–15",["Publish and consume Dataverse events","Synchronize Dataverse data","Custom connectors"]]],
  "AB-100": [["Plan AI-powered business solutions","35–40",["Analyze requirements","Design overall AI strategy","Evaluate costs and benefits"]],["Design AI-powered business solutions","30–35",["Design AI and agents for business solutions","Design extensibility of AI solutions","Orchestrate prebuilt agents and apps"]],["Deploy AI-powered business solutions","20–25",["Analyze, monitor, and tune solutions","Manage testing","Design the ALM process","Responsible AI, security, governance, risk and compliance"]]],
  "AB-210": [["Configure Dynamics 365 Sales core features for AI","15–20",["Configure Sales","Product catalog"]],["Optimize AI-driven sales","20–25",["AI-first sales strategy","Prepare to deploy agents","AI-powered intelligence and insights"]],["Qualify and prioritize leads by using AI","15–20",["Generate and nurture leads","Sales Qualification Agent"]],["Develop deals by using intelligent opportunity research","25–30",["Optimize opportunity management","Sales Close Agent","Sales Research Agent"]],["Extend and enhance Sales","10–15",["Supporting apps and services","Expand Sales with Power Platform"]]],
  "MB-230": [["Manage cases in Customer Service","51–55",["Foundational Customer Service components","Knowledge management","Collaboration","Agents and Copilot in Service","SLAs for cases"]],["Configure representative experience and routing","25–30",["Routing","Productivity tools","Copilot Service workspace"]],["Extend Customer Service","15–20",["Data model and UI components","Customer feedback with Customer Voice"]]],
  "AB-250": [["Deploy Dynamics 365 Contact Center","15–20",["Implement Contact Center","Deploy Contact Center","Manage users"]],["Implement channels","30–35",["Chat and digital channels","Voice channel","Channel features"]],["Configure agents and AI capabilities","10–15",["Agent assist capabilities","Voice agents"]],["Configure work distribution","10–15",["Queues","Basic and unified routing"]],["Configure the Dynamics 365 Contact Center representative experience","15–20",["Experience profiles","Productivity tools","Knowledge management"]],["Manage analytics for the Dynamics 365 Contact Center","10–15",["Supervisor experience","Analytics and reporting"]]],
  "MB-310": [["Implement financial management","35–40",["Chart of accounts and financial dimensions","Ledgers and currencies","Journals","Cash and bank","Periodic processes","Taxes"]],["Implement accounts receivable, credit, collections, and subscription billing","15–20",["Accounts receivable","Credit and collections","Subscription billing"]],["Implement and manage accounts payable and expenses","10–15",["Accounts payable","Expense management"]],["Manage budgeting","10–15",["Basic budgeting","Budget controls","Budget planning"]],["Manage fixed assets","10–15",["Implement and manage fixed assets","Fixed asset transactions"]]],
  "MB-330": [["Implement product information management","25–30",["Create and manage products","Product prerequisites","Additional product details","Inventory pricing and costing"]],["Implement inventory and asset management","20–25",["Inventory activities","Quality","Configure asset management","Implement asset management"]],["Implement and manage supply chain processes","15–20",["Procurement and sourcing","Landed cost","Sales and marketing features"]],["Implement warehouse management and transportation management","20–25",["Configure warehouse management","Warehouse processes","Transportation management","Warehouse Management mobile app"]],["Implement master planning","10–15",["Configure master planning","Manage master plans"]]],
  "MB-500": [["Plan the architecture and solution design","5–10",["Major components of finance and operations apps","Application lifecycle management (ALM)"]],["Apply developer tools","5–10",["Customize with Visual Studio","Source control with Azure DevOps"]],["Design and develop AOT elements","15–20",["Create and extend UI elements","Create and extend the data model","Create classes and extend AOT elements"]],["Develop and test code","20–25",["Develop X++ code","Object-oriented code","Framework functionality","Testing"]],["Implement reporting","10–15",["Select reporting tools","Dynamics 365 reports","Dynamics 365 workspaces"]],["Integrate and manage data solutions","15–20",["Data integration patterns","Data integration solutions","Data management","Integrate with Power Platform, Microsoft 365, and Azure"]],["Implement security and optimize performance","10–15",["Security policies and requirements","Performance optimization techniques","Optimize performance"]]],
  "MB-800": [["Set up Business Central","20–25",["Create and configure a company","Manage security","Core functionality","Dimensions","Approval workflows"]],["Configure financials","30–35",["Financial management","Chart of accounts","Posting groups","Journals and bank accounts","Accounts payable","Accounts receivable","Fixed assets"]],["Configure sales and purchasing","10–15",["Inventory","Master data for sales and purchasing","Pricing and discounts"]],["Perform Business Central operations","30–35",["Basic tasks","Process purchases","Process sales","Financial documents","Journals and payments","Fixed asset transactions","Inventory transactions"]]],
  "MB-820": [["Describe Business Central","10–15",["Business Central architecture","Business Central apps"]],["Install, develop, and deploy for Business Central","10–15",["Development environment","Create, debug, and deploy an extension"]],["Develop by using AL objects","35–40",["Tables and pages","Reports","XMLports","Codeunits","Entitlement and permission sets","Queries"]],["Develop by using AL","15–20",[]],["Work with development tools","10–15",["Semiautomated testing","Telemetry"]],["Integrate Business Central with other applications","10–15",["REST services from Business Central","Implement APIs"]]],
  "GH-900": [["Understand Git and GitHub basics","25–30",["Version control fundamentals","Working with GitHub"]],["Work with GitHub repositories","10–15",[]],["Collaborate using GitHub","10–15",["Collaboration tools"]],["Apply modern development practices","10–15",["Automation and AI tools"]],["Manage projects with GitHub","5–10",["Project tracking and organization"]],["Understand privacy, security, and administration","10–15",[]],["Explore the GitHub community","5–10",[]]],
  // Note: Microsoft's GH-300 study guide currently lists two similarly named
  // feature domains; we show the list exactly as published.
  "GH-300": [["Use GitHub Copilot responsibly","15–20",["Responsible AI principles","Validate and operate AI tools"]],["Use GitHub Copilot features","25–30",["Copilot in the IDE","Copilot CLI","Copilot features and capabilities","Organization-wide settings and policies"]],["GitHub Copilot features","25–30",[]],["Understand GitHub Copilot data and architecture","10–15",["Data handling and flow","Lifecycle and limitations"]],["Apply prompt engineering and context crafting","10–15",["Craft effective prompts","Engineer prompts for performance"]],["Improve developer productivity with GitHub Copilot","10–15",["Productivity and code quality","Testing and security"]],["Configure privacy, content exclusions, and safeguards","10–15",["Privacy settings and exclusions","Safeguards and troubleshooting"]]],
  "GH-200": [["Author and manage workflows","20–25",["Workflow triggers and events","Workflow structure","Workflow execution and outputs"]],["Consume and troubleshoot workflows","15–20",["Interpret workflow behavior","Artifacts and logs","Workflow templates"]],["Author and maintain actions","15–20",["Create and troubleshoot custom actions","Action structure and metadata","Distribute and maintain actions"]],["Manage GitHub Actions for the enterprise","20–25",["Govern actions and workflows","Manage runners at scale","Encrypted secrets and variables"]],["Secure and optimize automation","10–15",["Security best practices","Optimize performance and cost"]]],
  "GH-100": [["Manage GitHub identities and access","15–20",["User identities and authentication","Access and permissions"]],["Administer GitHub Enterprise environment","10–15",["Support users and stakeholders","Deployment and licensing"]],["Implement secure software development and compliance","25–30",["Security policies and rulesets","Repository security features","API access and integrations"]],["Manage GitHub Actions","20–25",["Workflows and reusable components","Runners","Encrypted secrets"]],["Monitor and optimize GitHub usage","10–15",["Monitor enterprise usage","Optimize cost and performance"]]],
  "GH-500": [["Describe GitHub Security suites, features, and ecosystem","15–20",["Security suites and architecture","Secure SDLC strategies","Security alerts","Access, governance, and supply chain security"]],["Configure and use Secret Protection","15–20",["Enable Secret Protection","Prevent secret exposure","Policies and customization"]],["Configure and use supply chain security","15–20",["Dependency and supply chain risks","Supply chain alerts","Secure dependencies","Policies and integrations"]],["Configure and use Code Security (CodeQL)","10–15",["Code scanning approaches","Set up Code Security","Triage and remediate results","Automate Code Security operations"]],["Security operations: best practices, prioritization, and remediation","15–20",["Remediation frameworks","Prioritize security work at scale","Customize detection","Governance across roles","Shift left"]],["GitHub Security suites administration","10–15",["Roll out security features at scale","Security defaults","Governance and access","CodeQL and automation"]]],
  "GH-600": [["Prepare agent architecture and SDLC processes","15–20",["Integrate agents into the SDLC","Boundaries between planning, reasoning, and action","Observability and control for autonomous agents"]],["Implement tool use and environment interaction","20–25",["Select and configure agent tools","Configure MCP servers","Integrate agents in development environments","Safe execution paths and error handling"]],["Manage memory, state, and execution","10–15",["Agent memory strategies","Persist state and manage context drift","Continuity across tools and environments"]],["Perform evaluation, error analysis, and tuning","15–20",["Success criteria and evaluation signals","Analyze agent failures","Tune agent behavior"]],["Orchestrate multi-agent coordination","15–20",["Operate multi-agent workflows","Observability for multi-agent behavior","Detect and respond to failures","Agent lifecycle in workflows"]],["Implement guardrails and accountability","10–15",["Define autonomy levels","Guardrails and human-in-the-loop workflows"]]],
  "AB-730": [["Understand generative AI fundamentals","25–30",["Generative AI across Microsoft 365","Responsible AI and data protection practices"]],["Manage prompts and chats by using Microsoft 365 Copilot","20–25",["Create and manage prompts","Manage chats"]],["Manage business content and collaboration by using Microsoft 365 Copilot","20–25",["Draft and analyze business content","Meetings and collaboration"]],["Drive business outcomes by using agents","20–25",["Select and apply prebuilt Copilot agents","Business tasks with Copilot Cowork"]]],
  "AB-731": [["Identify the business value of generative AI solutions","35–40",["Foundational concepts of generative AI","Benefits and capabilities of generative AI"]],["Identify benefits, capabilities, and opportunities for Microsoft's AI apps and services","35–40",["Microsoft 365 Copilot and Microsoft Copilot","Foundry Tools"]],["Identify an implementation and adoption strategy for Microsoft's AI apps and services","20–25",["Align strategy with Microsoft responsible AI policies","Plan AI adoption across the organization"]]],
};

/* A3. VALUE — practitioner perspective (not Microsoft's words).
     client: what this lets you deliver for customers
     team:   how it helps your own organisation / practice            */
export const VALUE = {
  "AZ-900": { client: ["Speak credibly about cloud models, cost and governance in early discovery conversations", "Frame Azure options in business terms before technical teams engage"],
              team: ["Gives non-engineers (sales, PMO, finance) a shared cloud vocabulary", "A low-cost first step that builds confidence for role-based paths"] },
  "AZ-104": { client: ["Stand up, secure and run Azure subscriptions, networks, storage and VMs for live workloads", "Diagnose day-2 operations issues — access, backup, monitoring — without escalation"],
              team: ["The base certification most Azure practices staff first", "Counts as the required first step for three Azure partner designations"] },
  "AZ-700": { client: ["Design hybrid connectivity — VPN, ExpressRoute, Virtual WAN — for migration programmes", "Lock down traffic with firewalls, WAF and private endpoints"],
              team: ["Deep networking skill that unblocks many Azure projects", "Earns points toward the Infrastructure partner designation"] },
  "AZ-802": { client: ["Run and modernise Active Directory and Windows Server estates across on-prem and Azure", "Plan hybrid identity, storage and monitoring for gradual cloud moves"],
              team: ["Keeps legacy-estate expertise current as clients modernise", "Earns points toward the Infrastructure partner designation"] },
  "AZ-305": { client: ["Own end-to-end Azure architecture: identity, data, continuity and infrastructure", "Produce designs that stand up to client architecture review boards"],
              team: ["Anchors solution reviews and pre-sales technical design", "A required step for Data & AI and the Advanced Azure partner metrics"] },
  "AZ-400": { client: ["Build CI/CD, infrastructure-as-code and release governance for faster, safer delivery", "Embed security and compliance checks into pipelines"],
              team: ["Standardises your own delivery engineering practices", "Earns Advanced points toward Digital & App Innovation"] },
  "AZ-401": { client: ["Modernise delivery pipelines across Azure DevOps and GitHub with AI-agent monitoring built in", "Bring security, compliance and instrumentation into one DevOps design"],
              team: ["Positions your engineering leads for agent-assisted DevOps", "Builds on AZ-400 skills with an AI-era refresh"] },
  "AZ-120": { client: ["Plan and run SAP migrations and RISE integrations on Azure with HA/DR built in", "Tune SAP landscapes for performance and cost"],
              team: ["Differentiates the practice on high-value SAP programmes", "Earns Advanced points toward the Infrastructure designation"] },
  "AZ-140": { client: ["Deliver secure virtual desktops for hybrid and frontline workforces", "Optimise user experience and image management at scale"],
              team: ["Supports end-user-computing offerings", "Earns Advanced points toward the Infrastructure designation"] },
  "AI-901": { client: ["Explain AI workloads and responsible-AI principles to business stakeholders", "Prototype simple generative AI and agent scenarios in Microsoft Foundry"],
              team: ["Builds AI literacy across delivery, sales and PMO", "A safe on-ramp before AI-103 or AI-200"] },
  "AI-103": { client: ["Build production RAG apps and agents on Microsoft Foundry", "Add vision, speech and document extraction to business processes"],
              team: ["Core capability for an AI engineering bench", "Earns points toward Data & AI and qualifies holders for AB-100 and AI-500"] },
  "AI-200": { client: ["Build the back-end services — containers, data, events, Functions — that AI apps run on", "Secure and monitor cloud-native AI solutions in production"],
              team: ["Replaces the old Azure Developer path for your dev teams", "Earns points toward Digital & App Innovation"] },
  "AI-300": { client: ["Take models and generative AI apps from pilot to governed production", "Set up evaluation, observability and optimisation for RAG and fine-tuned models"],
              team: ["Brings MLOps/GenAIOps discipline to your AI delivery", "Earns points toward Data & AI and qualifies for AB-100"] },
  "AI-500": { client: ["Architect multi-agent systems with memory, tools, guardrails and monitoring", "Lead design authority on complex agentic programmes"],
              team: ["Signals top-tier agentic AI architecture capability", "Sets internal patterns for evaluating and securing agents"] },
  "DP-900": { client: ["Discuss relational, non-relational and analytics options credibly", "Bridge business data questions to the right Azure services"],
              team: ["Shared data vocabulary for analysts, consultants and managers", "Low-cost entry to the Fabric and database paths"] },
  "PL-300": { client: ["Turn client data into trusted Power BI models, reports and decision dashboards", "Set up secure workspaces and governance for self-service BI"],
              team: ["Improves internal reporting and management information", "Earns points toward both Data & AI and Business Applications"] },
  "DP-600": { client: ["Build lakehouses, warehouses and enterprise semantic models in Microsoft Fabric", "Deliver analytics platforms that scale beyond departmental BI"],
              team: ["Positions the practice for Fabric programmes", "Earns points toward Data & AI"] },
  "DP-700": { client: ["Engineer batch and streaming pipelines in Fabric with proper lifecycle and security", "Monitor and optimise data platforms in production"],
              team: ["Core data-engineering capability for analytics offerings", "Earns points toward Data & AI"] },
  "DP-750": { client: ["Engineer governed lakehouse pipelines on Azure Databricks with Unity Catalog", "Improve data quality and reliability for analytics and AI"],
              team: ["Covers clients standardised on Databricks", "Earns points toward Data & AI"] },
  "DP-300": { client: ["Migrate, secure and tune Azure SQL estates with HA/DR", "Reduce outage risk and performance issues on critical databases"],
              team: ["Keeps database operations skills current", "Earns points toward Data & AI"] },
  "DP-800": { client: ["Build AI features — embeddings, intelligent search, RAG — directly on SQL", "Modernise T-SQL development with CI/CD"],
              team: ["Lets database teams contribute to AI projects", "Earns points toward Data & AI"] },
  "DP-420": { client: ["Design Cosmos DB backends for agent memory, conversation state and global apps", "Optimise partitioning and cost for high-scale workloads"],
              team: ["Specialist skill for AI app back-ends", "Earns points toward Data & AI"] },
  "SC-900": { client: ["Hold informed conversations about identity, security and compliance risk", "Explain Microsoft's security and Purview capabilities to stakeholders"],
              team: ["Builds security awareness across all roles", "A gentle start before SC-200, SC-300 or SC-401"] },
  "SC-200": { client: ["Detect, investigate and respond to threats with Defender XDR and Sentinel", "Run or support managed SOC services"],
              team: ["Strengthens your own security operations", "A required step for the Security partner designation"] },
  "SC-300": { client: ["Implement Entra identity, Conditional Access and identity governance — the core of Zero Trust", "Reduce account-compromise and access-sprawl risk"],
              team: ["Tightens internal identity hygiene", "Earns points toward Security and Modern Work designations"] },
  "SC-401": { client: ["Classify and protect sensitive data, including data used by Copilot and AI", "Implement DLP, retention and insider-risk controls"],
              team: ["Helps your organisation adopt AI without leaking data", "Earns points toward the Security designation"] },
  "SC-500": { client: ["Secure Azure workloads end to end — including AI services — with Defender for Cloud", "Harden identity, data, network and compute layers"],
              team: ["Brings cloud and AI security into delivery projects", "A required first step for the Security partner designation"] },
  "SC-100": { client: ["Shape enterprise security strategy, Zero Trust architecture and ransomware resilience", "Lead security design reviews at CISO level"],
              team: ["Senior security authority for bids and design reviews", "Earns points toward the Security designation"] },
  "AB-900": { client: ["Advise on Copilot readiness: data governance, oversharing and admin basics", "Explain Microsoft 365 security principles to business owners"],
              team: ["Prepares IT for a safe internal Copilot rollout", "Earns Intermediate points toward Modern Work"] },
  "MD-102": { client: ["Deploy and secure Windows and mobile devices with Intune", "Modernise device management and patching"],
              team: ["Improves your own endpoint security posture", "Earns points toward Modern Work; a prerequisite path to MS-102"] },
  "MS-700": { client: ["Plan and govern Teams environments, meetings and calling", "Resolve call-quality and adoption issues"],
              team: ["Keeps your collaboration platform healthy", "Earns points toward Modern Work"] },
  "MS-721": { client: ["Design and deliver Teams Phone, Rooms and large-event solutions", "Run voice and meeting-room migrations"],
              team: ["Specialist skill for collaboration offerings", "Earns points toward Modern Work"] },
  "AB-650": { client: ["Administer and secure Microsoft 365 tenants with Copilot and agents in scope", "Govern agents with Agent 365 and monitor AI usage"],
              team: ["Prepares your admins to run Copilot and agents safely", "Earns Advanced points toward Modern Work"] },
  "MS-102": { client: ["Run Microsoft 365 tenants end to end: identity, Defender XDR and Purview", "Lead tenant-wide security and compliance improvements"],
              team: ["Senior Microsoft 365 administration authority", "Earns Advanced points toward Modern Work (recognised to Nov 2027 if earned before retirement)"] },
  "PL-900": { client: ["Spot quick-win automation and app opportunities in discovery workshops", "Explain Power Platform and Copilot Studio value to business users"],
              team: ["Enables citizen developers across business teams", "An easy first step before AB-410 or AB-620"] },
  "AB-410": { client: ["Translate requirements into AI-powered model-driven and canvas apps with automation", "Deliver working business apps quickly with AI-enabled design"],
              team: ["Core functional-consultant capability for Power Platform practices", "Earns points toward Business Applications; qualifies for AB-100"] },
  "AB-620": { client: ["Design and ship Copilot Studio agents grounded in enterprise knowledge", "Integrate agents with tools, Azure and other agents"],
              team: ["Builds an agent-building bench for internal automation", "Qualifies holders for the AB-100 expert certification"] },
  "AB-400": { client: ["Extend Power Platform with plug-ins, PCF, code apps, connectors and Foundry agents", "Solve the integrations low-code alone can't"],
              team: ["Pro-developer depth for complex Power Platform work", "Earns points toward Business Applications and Digital & App Innovation"] },
  "AB-100": { client: ["Plan, design and deploy agentic AI business solutions across Dynamics 365, Power Platform and Azure", "Build the cost-benefit and governance case for AI programmes"],
              team: ["Senior architect credential for business-application practices", "Earns Advanced points toward Business Applications"] },
  "AB-210": { client: ["Configure Dynamics 365 Sales with AI agents for lead qualification and deal closing", "Design an AI-first sales process"],
              team: ["Can sharpen your own pipeline management", "Earns points toward Business Applications; qualifies for AB-100"] },
  "MB-230": { client: ["Implement case management, knowledge, SLAs and routing in Customer Service", "Bring Copilot into service workflows"],
              team: ["Core CRM service capability", "Earns points toward Business Applications; qualifies for AB-100"] },
  "AB-250": { client: ["Deploy AI-powered omnichannel contact centres with voice agents", "Improve routing, agent assist and supervisor analytics"],
              team: ["Positions the practice for contact-centre transformation", "Earns points toward Business Applications; qualifies for AB-100"] },
  "MB-310": { client: ["Implement general ledger, AR/AP, budgeting and fixed assets in Dynamics 365 Finance", "Translate finance processes into configured solutions"],
              team: ["Core ERP finance capability", "Earns points toward Business Applications; qualifies for AB-100"] },
  "MB-330": { client: ["Implement product, inventory, warehouse and master planning in Supply Chain Management", "Streamline procurement-to-fulfilment processes"],
              team: ["Core ERP supply-chain capability", "Earns points toward Business Applications; qualifies for AB-100"] },
  "AB-330": { client: ["Implement end-to-end supply chain processes in Dynamics 365 aligned to Microsoft's business process catalogue", "Apply AI capabilities across source-to-pay, order-to-cash and inventory-to-deliver"],
              team: ["Refreshes ERP supply-chain consulting skills for the AI era", "Complements MB-330 for supply-chain practices"] },
  "MB-500": { client: ["Build X++ extensions, integrations and reports for Finance and Operations apps", "Keep customisations upgrade-safe and performant"],
              team: ["Technical depth for ERP delivery", "Earns points toward Business Applications; qualifies for AB-100"] },
  "MB-800": { client: ["Implement Business Central for small and mid-size businesses end to end", "Set up finance, sales and purchasing quickly"],
              team: ["Supports SMB ERP offerings", "Earns points toward Business Applications; qualifies for AB-100"] },
  "MB-820": { client: ["Build AL extensions and API integrations for Business Central", "Automate testing and monitor telemetry"],
              team: ["Technical depth for SMB ERP delivery", "Earns Advanced points toward Business Applications"] },
  "GH-900": { client: ["Collaborate in client repositories with sound Git and GitHub habits", "Understand modern development workflows in delivery discussions"],
              team: ["Common ground for developers, testers and PMs", "Quick first step before the other GitHub certifications"] },
  "GH-300": { client: ["Use GitHub Copilot productively and responsibly on client code", "Advise on Copilot rollout, privacy settings and safeguards"],
              team: ["Lifts developer productivity across the team", "Earns Advanced points toward Digital & App Innovation"] },
  "GH-200": { client: ["Automate build, test and release with GitHub Actions", "Govern runners, secrets and reusable workflows at scale"],
              team: ["Standardises your own CI/CD", "Earns Advanced points toward Digital & App Innovation"] },
  "GH-100": { client: ["Administer GitHub Enterprise identity, policies and compliance", "Optimise licensing and usage"],
              team: ["Keeps your own GitHub estate governed", "Earns Advanced points toward Digital & App Innovation"] },
  "GH-500": { client: ["Roll out secret protection, dependency security and CodeQL scanning", "Prioritise and remediate vulnerabilities at scale"],
              team: ["Shifts security left in your own delivery", "Earns Advanced points toward Digital & App Innovation"] },
  "GH-600": { client: ["Build and run coding agents with tools, MCP servers, memory and guardrails", "Evaluate and tune agent behaviour in the software lifecycle"],
              team: ["Brings agentic development practices into engineering", "Earns points toward Digital & App Innovation"] },
  "GH-700": { client: ["Run client project work in GitHub with Copilot, custom agents and agentic workflows", "Design human-in-the-loop checks so AI automations stay accountable"],
              team: ["Gives PMs and analysts a shared, governed way to automate work with agents", "A business-side entry point into GitHub's AI tooling"] },
  "AB-730": { client: ["Use Copilot and agents well in day-to-day client work", "Model responsible AI behaviour in front of customers"],
              team: ["Raises everyday AI productivity across non-technical roles", "A practical, low-cost way to build AI fluency at scale"] },
  "AB-731": { client: ["Build the business case and adoption plan for Microsoft AI", "Advise leaders on responsible AI and value realisation"],
              team: ["Equips managers to lead AI change internally", "Helps leadership pick the right Microsoft AI investments"] },
};

/* A4. PARTNER — where a certification counts in the Microsoft AI Cloud
   Partner Program "Solutions Partner" designations (skilling category),
   from Microsoft Partner Center pages updated 19–23 Oct 2026.
     d = designation, m = metric / step, t = "points" (earns score)
     or "gate" (a required step that unlocks points).                  */
export const PARTNER = {
  "AZ-104": [{ d: "Data & AI (Azure)", m: "Step 1 — required before points", t: "gate" }, { d: "Infrastructure (Azure)", m: "Intermediate · Step 1 — required", t: "gate" }, { d: "Digital & App Innovation (Azure)", m: "Intermediate · Step 1 — required", t: "gate" }],
  "AZ-305": [{ d: "Data & AI (Azure)", m: "Step 2 — required before points", t: "gate" }, { d: "Infrastructure (Azure)", m: "Advanced · Step 1 — required", t: "gate" }, { d: "Digital & App Innovation (Azure)", m: "Advanced · Step 1 — required", t: "gate" }],
  "AZ-700": [{ d: "Infrastructure (Azure)", m: "Intermediate · Step 2", t: "points" }],
  "AZ-802": [{ d: "Infrastructure (Azure)", m: "Intermediate · Step 2 (Windows Server Hybrid Administrator)", t: "points" }],
  "AZ-120": [{ d: "Infrastructure (Azure)", m: "Advanced · Step 2", t: "points" }],
  "AZ-140": [{ d: "Infrastructure (Azure)", m: "Advanced · Step 2", t: "points" }],
  "AZ-400": [{ d: "Digital & App Innovation (Azure)", m: "Advanced · Step 2", t: "points" }],
  "AI-103": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "AI-200": [{ d: "Digital & App Innovation (Azure)", m: "Intermediate · Step 2", t: "points" }],
  "AI-300": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "PL-300": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }, { d: "Business Applications", m: "Intermediate", t: "points" }],
  "DP-600": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "DP-700": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "DP-750": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "DP-300": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "DP-800": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "DP-420": [{ d: "Data & AI (Azure)", m: "Step 3", t: "points" }],
  "SC-500": [{ d: "Security", m: "Step 1 — required before points", t: "gate" }],
  "SC-200": [{ d: "Security", m: "Step 2 — required before points", t: "gate" }],
  "SC-300": [{ d: "Security", m: "Step 3", t: "points" }, { d: "Modern Work", m: "Intermediate", t: "points" }],
  "SC-401": [{ d: "Security", m: "Step 3", t: "points" }],
  "SC-100": [{ d: "Security", m: "Step 3", t: "points" }],
  "AB-900": [{ d: "Modern Work", m: "Intermediate", t: "points" }],
  "MD-102": [{ d: "Modern Work", m: "Intermediate", t: "points" }],
  "MS-700": [{ d: "Modern Work", m: "Intermediate", t: "points" }],
  "MS-721": [{ d: "Modern Work", m: "Intermediate", t: "points" }],
  "AB-650": [{ d: "Modern Work", m: "Advanced", t: "points" }],
  "MS-102": [{ d: "Modern Work", m: "Advanced — recognised until 30 Nov 2027 if earned before retirement", t: "points" }],
  "AB-410": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "AB-400": [{ d: "Business Applications", m: "Intermediate", t: "points" }, { d: "Digital & App Innovation (Azure)", m: "Intermediate · Step 2", t: "points" }],
  "AB-100": [{ d: "Business Applications", m: "Advanced", t: "points" }],
  "AB-210": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "MB-230": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "AB-250": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "MB-310": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "MB-330": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "MB-500": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "MB-800": [{ d: "Business Applications", m: "Intermediate", t: "points" }],
  "MB-820": [{ d: "Business Applications", m: "Advanced", t: "points" }],
  "GH-300": [{ d: "Digital & App Innovation (Azure)", m: "Advanced · Step 2", t: "points" }],
  "GH-200": [{ d: "Digital & App Innovation (Azure)", m: "Advanced · Step 2", t: "points" }],
  "GH-100": [{ d: "Digital & App Innovation (Azure)", m: "Advanced · Step 2", t: "points" }],
  "GH-500": [{ d: "Digital & App Innovation (Azure)", m: "Advanced · Step 2", t: "points" }],
  "GH-600": [{ d: "Digital & App Innovation (Azure)", m: "Intermediate · Step 2", t: "points" }],
};
// Official pages for each designation (linked from the partner panel)
export const PARTNER_LINKS = {
  "Data & AI (Azure)": "https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-azure",
  "Infrastructure (Azure)": "https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-azure",
  "Digital & App Innovation (Azure)": "https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-azure",
  "Business Applications": "https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-business",
  "Modern Work": "https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-modern-work",
  "Security": "https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-security",
};

/* A5. DOMAINS — the areas a person can choose, per career track. */
export const DOMAINS = {
  azure:    { icon: "☁️", label: "Azure cloud & infrastructure", desc: "Run, network and architect workloads on Azure.", tracks: ["technical"] },
  ai:       { icon: "🤖", label: "AI apps & agents (build)", desc: "Build AI apps, agents and ML pipelines on Microsoft Foundry.", tracks: ["technical"] },
  data:     { icon: "📊", label: "Data & analytics", desc: "Power BI, Fabric, Databricks, SQL and databases.", tracks: ["technical", "functional", "business"] },
  security: { icon: "🛡️", label: "Security, identity & compliance", desc: "Defend, govern and protect people and data.", tracks: ["technical", "functional", "business"] },
  m365:     { icon: "💼", label: "Microsoft 365 & Copilot admin", desc: "Run Microsoft 365, Teams, devices and Copilot.", tracks: ["technical"] },
  power:    { icon: "⚡", label: "Power Platform & agents", desc: "Low-code apps, automation and Copilot Studio agents.", tracks: ["technical", "functional", "business"] },
  d365:     { icon: "🏢", label: "Dynamics 365 (CRM & ERP)", desc: "Sales, service, finance, supply chain, Business Central.", tracks: ["technical", "functional"] },
  github:   { icon: "🐙", label: "GitHub & DevOps", desc: "Copilot, Actions, administration, security and agents.", tracks: ["technical", "functional", "business"] },
  aibiz:    { icon: "🧭", label: "AI at work & AI leadership", desc: "Use AI well every day, or lead AI change.", tracks: ["functional", "business"] },
};

/* A6. ROLES — end-points of the decision tree. Each "ladder" lists the
   certifications in the order you'd earn them; prerequisites for expert
   certifications are respected (checked against Microsoft's pages).     */
export const ROLES = [
  { id: "az-admin", domain: "azure", depth: "broad", tracks: ["technical"], icon: "🧰", label: "Cloud administrator → architect", desc: "Run Azure day to day, then design whole solutions.", ladder: ["AZ-900", "AZ-104", "AZ-305"] },
  { id: "az-devops", domain: "azure", depth: "deep", tracks: ["technical"], icon: "🔁", label: "DevOps / platform engineer", desc: "Pipelines, infrastructure-as-code, release automation.", ladder: ["AZ-900", "AZ-104", "AZ-400"] },
  { id: "az-agentic-devops", domain: "azure", depth: "deep", tracks: ["technical"], icon: "🤖", label: "Agentic DevOps engineer", desc: "DevOps with AI agents across Azure DevOps and GitHub.", ladder: ["AZ-900", "AZ-104", "AZ-401"] },
  { id: "az-net", domain: "azure", depth: "deep", tracks: ["technical"], icon: "🌐", label: "Network engineer", desc: "Hybrid networking, routing, private connectivity.", ladder: ["AZ-900", "AZ-104", "AZ-700"] },
  { id: "az-win", domain: "azure", depth: "deep", tracks: ["technical"], icon: "🖥️", label: "Windows Server administrator", desc: "On-prem and hybrid Windows Server estates.", ladder: ["AZ-900", "AZ-802"] },
  { id: "az-avd", domain: "azure", depth: "deep", tracks: ["technical"], icon: "🪟", label: "Virtual desktop specialist", desc: "Design and run Azure Virtual Desktop.", ladder: ["AZ-900", "AZ-104", "AZ-140"] },
  { id: "az-sap", domain: "azure", depth: "deep", tracks: ["technical"], icon: "🏭", label: "SAP on Azure specialist", desc: "Migrate and operate SAP workloads on Azure.", ladder: ["AZ-900", "AZ-104", "AZ-120"] },

  { id: "ai-agents", domain: "ai", depth: "broad", tracks: ["technical"], icon: "🧠", label: "AI app & agent developer", desc: "RAG apps and multi-agent systems on Microsoft Foundry.", ladder: ["AI-901", "AI-103", "AI-500"] },
  { id: "ai-cloud", domain: "ai", depth: "broad", tracks: ["technical"], icon: "💻", label: "Cloud application developer", desc: "Back-end and cloud-native apps with AI services.", ladder: ["AI-901", "AI-200", "AI-103"] },
  { id: "ai-mlops", domain: "ai", depth: "deep", tracks: ["technical"], icon: "⚙️", label: "ML / GenAI operations engineer", desc: "Train, deploy, evaluate and operate models.", ladder: ["AI-901", "AI-300"] },

  { id: "data-analyst", domain: "data", depth: "broad", tracks: ["technical", "functional", "business"], icon: "📈", label: "Data / BI analyst", desc: "Turn data into Power BI reports and decisions.", ladder: ["DP-900", "PL-300", "DP-600"] },
  { id: "data-fabric", domain: "data", depth: "deep", tracks: ["technical"], icon: "🧵", label: "Fabric data engineer", desc: "Lakehouses, pipelines and real-time data in Fabric.", ladder: ["DP-900", "DP-700", "DP-600"] },
  { id: "data-dbx", domain: "data", depth: "deep", tracks: ["technical"], icon: "🔥", label: "Databricks data engineer", desc: "Lakehouse engineering on Azure Databricks.", ladder: ["DP-900", "DP-750"] },
  { id: "data-dba", domain: "data", depth: "deep", tracks: ["technical"], icon: "🗄️", label: "Database admin / SQL AI developer", desc: "Run Azure SQL, then build AI features on SQL.", ladder: ["DP-900", "DP-300", "DP-800"] },
  { id: "data-cosmos", domain: "data", depth: "deep", tracks: ["technical"], icon: "🪐", label: "Cosmos DB AI developer", desc: "NoSQL back-ends for AI apps and agents.", ladder: ["DP-900", "DP-420"] },

  { id: "sec-cloud", domain: "security", depth: "broad", tracks: ["technical"], icon: "🔐", label: "Cloud & AI security engineer", desc: "Secure Azure and AI workloads end to end.", ladder: ["SC-900", "SC-500", "SC-100"] },
  { id: "sec-ops", domain: "security", depth: "deep", tracks: ["technical"], icon: "🚨", label: "Security operations (SOC) analyst", desc: "Detect and respond with Defender and Sentinel.", ladder: ["SC-900", "SC-200", "SC-100"] },
  { id: "sec-id", domain: "security", depth: "deep", tracks: ["technical"], icon: "🪪", label: "Identity & access administrator", desc: "Microsoft Entra, access governance, Zero Trust.", ladder: ["SC-900", "SC-300", "SC-100"] },
  { id: "sec-info", domain: "security", depth: "broad", tracks: ["technical", "functional"], icon: "📁", label: "Data protection & compliance", desc: "Purview, DLP and protecting data used by AI.", ladder: ["SC-900", "SC-401"] },
  { id: "sec-aware", domain: "security", depth: "broad", tracks: ["business"], icon: "🧑‍💼", label: "Security-literate professional", desc: "Understand security, identity and compliance concepts.", ladder: ["SC-900"] },

  { id: "m365-admin", domain: "m365", depth: "broad", tracks: ["technical"], icon: "🗂️", label: "Microsoft 365 & Copilot administrator", desc: "Tenant, Copilot and agent administration.", ladder: ["AB-900", "AB-650"] },
  { id: "m365-endpoint", domain: "m365", depth: "deep", tracks: ["technical"], icon: "📱", label: "Endpoint / device administrator", desc: "Intune, Windows and device management.", ladder: ["AB-900", "MD-102", "MS-102"] },
  { id: "m365-teams", domain: "m365", depth: "deep", tracks: ["technical"], icon: "📞", label: "Teams & communications engineer", desc: "Teams administration, voice and meeting systems.", ladder: ["AB-900", "MS-700", "MS-721"] },

  { id: "pp-builder", domain: "power", depth: "broad", tracks: ["functional", "technical", "business"], icon: "🧩", label: "Intelligent app builder / consultant", desc: "Requirements to working AI-powered business apps.", ladder: ["PL-900", "AB-410", "AB-100"] },
  { id: "pp-agents", domain: "power", depth: "deep", tracks: ["functional", "technical"], icon: "🤝", label: "Copilot Studio agent builder", desc: "Design and ship agents for business processes.", ladder: ["PL-900", "AB-620", "AB-100"] },
  { id: "pp-dev", domain: "power", depth: "deep", tracks: ["technical"], icon: "🛠️", label: "Power Platform pro developer", desc: "Plug-ins, PCF, connectors and code apps.", ladder: ["PL-900", "AB-400", "AB-100"] },

  { id: "d365-sales", domain: "d365", depth: "deep", tracks: ["functional"], icon: "🎯", label: "Sales (CRM) consultant", desc: "AI-powered selling with Dynamics 365 Sales.", ladder: ["PL-900", "AB-210", "AB-100"] },
  { id: "d365-service", domain: "d365", depth: "deep", tracks: ["functional"], icon: "🎧", label: "Customer service consultant", desc: "Case management, knowledge, service experiences.", ladder: ["PL-900", "MB-230", "AB-100"] },
  { id: "d365-cc", domain: "d365", depth: "deep", tracks: ["technical", "functional"], icon: "☎️", label: "Contact center AI engineer", desc: "Omnichannel and AI contact-centre solutions.", ladder: ["PL-900", "AB-250", "AB-100"] },
  { id: "d365-fin", domain: "d365", depth: "deep", tracks: ["functional"], icon: "💰", label: "Finance (ERP) consultant", desc: "General ledger, budgeting, financial processes.", ladder: ["MB-310", "AB-100"] },
  { id: "d365-scm", domain: "d365", depth: "deep", tracks: ["functional"], icon: "🚚", label: "Supply chain (ERP) consultant", desc: "Inventory, warehousing, planning, procurement.", ladder: ["MB-330", "AB-100"] },
  { id: "d365-scm-ai", domain: "d365", depth: "deep", tracks: ["functional"], icon: "🏭", label: "Supply chain AI consultant", desc: "Process-catalogue supply chain with AI in Dynamics 365.", ladder: ["AB-330"] },
  { id: "d365-fodev", domain: "d365", depth: "deep", tracks: ["technical"], icon: "🧑‍💻", label: "Finance & Operations developer", desc: "X++ development and extensions for F&O apps.", ladder: ["MB-500", "AB-100"] },
  { id: "d365-bc", domain: "d365", depth: "broad", tracks: ["functional"], icon: "🏪", label: "Business Central consultant (SMB ERP)", desc: "Implement ERP for small and mid-size firms.", ladder: ["MB-800", "AB-100"] },
  { id: "d365-bcdev", domain: "d365", depth: "broad", tracks: ["technical"], icon: "🧱", label: "Business Central developer", desc: "AL development, extensions and APIs.", ladder: ["MB-820", "AB-100"] },

  { id: "gh-copilot", domain: "github", depth: "broad", tracks: ["technical"], icon: "✨", label: "AI-assisted developer", desc: "Get the most from GitHub Copilot.", ladder: ["GH-900", "GH-300"] },
  { id: "gh-agents", domain: "github", depth: "deep", tracks: ["technical"], icon: "🦾", label: "Agentic AI developer", desc: "Coding agents, MCP tools, memory and guardrails.", ladder: ["GH-900", "GH-300", "GH-600"] },
  { id: "gh-biz", domain: "github", depth: "broad", tracks: ["functional", "business"], icon: "🧑‍💼", label: "Agentic AI for business teams", desc: "GitHub and Copilot agents for PMs and analysts.", ladder: ["GH-900", "GH-700"] },
  { id: "gh-actions", domain: "github", depth: "deep", tracks: ["technical"], icon: "▶️", label: "CI/CD automation engineer", desc: "Workflows and automation with GitHub Actions.", ladder: ["GH-900", "GH-200"] },
  { id: "gh-admin", domain: "github", depth: "deep", tracks: ["technical"], icon: "🏛️", label: "GitHub enterprise administrator", desc: "Organisations, policies and access.", ladder: ["GH-900", "GH-100"] },
  { id: "gh-sec", domain: "github", depth: "deep", tracks: ["technical"], icon: "🔎", label: "Application security (DevSecOps)", desc: "Secret protection, supply chain and code security.", ladder: ["GH-900", "GH-500"] },

  { id: "aibiz-pro", domain: "aibiz", depth: "broad", tracks: ["functional", "business"], icon: "🚀", label: "AI-fluent professional", desc: "Use Copilot and agents productively and responsibly.", ladder: ["AB-730"] },
  { id: "aibiz-lead", domain: "aibiz", depth: "broad", tracks: ["functional", "business"], icon: "👑", label: "AI transformation leader", desc: "Set AI strategy, value cases and adoption plans.", ladder: ["AB-731"] },
];


/* =====================================================================
   MERGE — combine the hand-written data above with the monthly refresh
   (src/data/ms-certifications.refresh.json, rewritten on the 1st of every
   month by scripts/ms-certs/refresh.mjs via GitHub Actions).

   Rules:
   • Microsoft Learn is the source of truth for WHAT exists: a certification
     that's gone from Microsoft Learn is dropped; one that's new is added.
   • Microsoft Learn also wins for facts: current name, page address, beta
     status, retirement date and the official skills outline.
   • The hand-written data supplies judgement: career area, decision-tree
     roles, value notes, partner credit, prerequisites and notes.
   ===================================================================== */
import REFRESH from './ms-certifications.refresh.json';

// Microsoft's level words → the levels this page uses
function levelFor(live) {
  if (/^GitHub/.test(live.title) || /^GH-/.test(live.code)) return 'GitHub';
  if ((live.types || []).includes('Business')) return 'Business';
  if (/Expert\b/.test(live.title)) return 'Expert';
  if (/Specialty\b/.test(live.title)) return 'Specialty';
  if (/Fundamentals\b/.test(live.title) || live.level === 'Beginner') return 'Fundamentals';
  return 'Associate';
}

// Best guess at the career area for a brand-new certification (from its code and name)
function domainFor(live) {
  const t = live.title, c = live.code;
  if (/^GH-/.test(c)) return 'github';
  if (/Dynamics 365|Supply Chain|Business Central/.test(t) || /^MB-/.test(c)) return 'd365';
  if (/Microsoft 365|Teams|Endpoint|Copilot and Agent Administration/.test(t) || /^(MS|MD)-/.test(c)) return 'm365';
  if (/Power Platform|Copilot Studio|Agent Builder|Applications Builder|Business Solutions Architect/.test(t) || /^PL-9/.test(c)) return 'power';
  if (/^SC-/.test(c)) return 'security';
  if (/^DP-|^PL-3/.test(c)) return 'data';
  if (/^AI-/.test(c)) return 'ai';
  if (/^AB-7/.test(c)) return 'aibiz';
  return 'azure';
}

const live = new Map((REFRESH.certs || []).map((c) => [c.code, c]));
const hasLive = live.size >= 30;                 // never drop everything because of a bad file

// The certification list the page actually uses
export const CERTS = [
  // 1. hand-written certifications that Microsoft still lists (or all of them, if the refresh file is unusable)
  ...CURATED_CERTS
    .filter((c) => !hasLive || live.has(c.code))
    .map((c) => {
      const l = live.get(c.code);
      if (!l) return c;
      return {
        ...c,
        name: l.title.replace(/^GitHub Certified:\s*/, '') === c.name.replace(/^GitHub Certified:\s*/, '') ? c.name : l.title,
        page: l.slug ? `${l.slug}/` : c.page,
        beta: l.beta,
        retire: l.retire || c.retire || undefined,
        firstSeen: l.firstSeen,
      };
    }),
  // 2. certifications Microsoft has launched that nobody has written up yet
  ...[...live.values()]
    .filter((l) => !CURATED_CERTS.some((c) => c.code === l.code))
    .map((l) => ({
      code: l.code, name: l.title, level: levelFor(l), domain: domainFor(l),
      page: l.slug ? `${l.slug}/` : null, roles: l.roles || undefined, beta: l.beta,
      retire: l.retire || undefined, firstSeen: l.firstSeen, auto: true,
      note: `Added automatically from Microsoft Learn on ${l.firstSeen}. A fuller write-up is on its way.`,
    })),
];

// Official skills outlines: the refreshed version wins, the hand-written one is the fallback
export const SKILLS = Object.fromEntries(
  CERTS.map((c) => [c.code, (live.get(c.code) || {}).skills || CURATED_SKILLS[c.code]]).filter(([, v]) => v),
);

// Page facts, including the refresh dates shown at the top of the page
const nowYear = (REFRESH.lastRefreshed || PAGE_CURATED.verified).slice(0, 4);
export const PAGE = {
  ...PAGE_CURATED,
  verified: REFRESH.lastRefreshed || PAGE_CURATED.verified,
  lastRefreshed: REFRESH.lastRefreshed || PAGE_CURATED.verified,
  nextRefresh: REFRESH.nextRefresh || null,
  baseline: REFRESH.baseline || null,
  year: nowYear,
};

// A certification counts as "new" if the refresher first saw it after the
// first run, within the last 60 days — or it's beta and was added by hand recently.
export function isNew(c, today = new Date()) {
  if (!c.firstSeen || !PAGE.baseline || c.firstSeen <= PAGE.baseline) return Boolean(c.beta && c.firstSeen === PAGE.baseline);
  return (today - new Date(c.firstSeen + 'T00:00:00Z')) / 86400000 <= 60;
}

// Retirements table: the hand-written rows (which say where to go next),
// plus any retirement Microsoft announces that isn't in them yet.
const retired = [...(REFRESH.retirements?.scheduled || []).map((r) => ({ ...r, upcoming: true })), ...(REFRESH.retirements?.recent || [])];
export const CHANGES = [
  ...CURATED_CHANGES,
  ...retired
    .filter((r) => !CURATED_CHANGES.some((ch) => ch.old.split(' / ').includes(r.code)))
    .map((r) => ({ old: r.code, name: r.name, date: r.date, next: null })),
]
  // "upcoming" is worked out from the date, so it flips by itself once the date passes
  .map((ch) => ({ ...ch, upcoming: ch.date >= PAGE.lastRefreshed }))
  .sort((a, b) => a.date.localeCompare(b.date));
