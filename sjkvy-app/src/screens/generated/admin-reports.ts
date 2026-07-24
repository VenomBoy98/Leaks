// GENERATED from handoff app/admin-reports.html — do not edit by hand. Regenerate: npm run convert
export const portal = "admin";
export const title = "SJKVY Portal | Reports & Intelligence";
export const html = `<!-- Sidebar (Shared Component) -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-xl flex flex-col py-8 z-50">
<div class="px-6 mb-10">
<h1 class="font-display-md text-secondary-fixed tracking-tight">SJKVY Portal</h1>
<p class="font-label-sm text-secondary-fixed/70 text-[10px] uppercase tracking-widest mt-1">Centre Admin</p>
</div>
<nav class="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-label-md">Directory</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
<!-- Active State: Reports -->
<a class="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-secondary-fixed font-bold border-l-4 border-secondary-fixed" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md">Reports</span>
</a>
</nav>
<div class="px-4 mt-auto pt-8 border-t border-white/10 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md">Settings</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">help</span>
<span class="font-label-md">Support</span>
</a>
<button class="w-full mt-4 bg-secondary-fixed text-on-secondary-fixed py-3 px-4 rounded-xl font-label-md hover:brightness-95 active:scale-95 transition-all flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[18px]">add</span>
                Quick Enroll
            </button>
</div>
</aside>
<!-- Main Canvas -->
<main class="ml-72 min-h-screen">
<!-- Top Bar (Shared Component) -->
<header class="sticky top-0 z-40 h-20 px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline-variant">
<div class="flex items-center gap-6">
<div class="relative">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="bg-surface-container-low border-none rounded-full pl-10 pr-6 py-2 w-80 text-body-md focus:ring-2 focus:ring-primary focus:bg-white transition-all" placeholder="Search reports, templates, data..." type="text"/>
</div>
</div>
<div class="flex items-center gap-4">
<button class="p-2 rounded-full hover:bg-surface-container text-on-surface-variant relative transition-colors">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="h-10 w-[1px] bg-outline-variant mx-2"></div>
<div class="flex items-center gap-3">
<div class="text-right">
<p class="font-label-md text-on-surface leading-none">Admin User</p>
<p class="text-caption text-on-surface-variant">Regional Director</p>
</div>
<div class="w-10 h-10 rounded-full border-2 border-primary-fixed overflow-hidden">
<img class="w-full h-full object-cover" data-alt="A professional headshot of a middle-aged institutional administrator in business attire, looking confident and approachable. The background is a soft-focus office with warm mahogany wood and gold accents, reflecting a high-end, academic environment. The lighting is soft and flattering, emphasizing a mood of authority and trustworthiness in a light-mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGzaLtEIW2AKxhTWU334Es7PTwcPf4oh4mcW-M0n7GUP3RNluetjCFjrj1qCaVPXKBwmFtKTOnFuU6mxMDJalBHsmSFT9mRKAQ1U6qrjIWdkFTCE7_kuO6zUYR5Sx_tP2k6im-MCln1WQVWcBfr_DR0630LHlASDf-lLm_yPJ-PWjg2ZewScEMo7qYBrzJC19zVrBP8NA2QhZaYx8hTwRUxxYmy56kuwZgqpAPVhwm6HgCCvz5TSTL"/>
</div>
</div>
</div>
</header>
<!-- Content Area -->
<div class="p-12 max-w-[1440px] mx-auto">
<!-- Header Section -->
<div class="flex justify-between items-end mb-12">
<div>
<h2 class="font-display-lg text-on-background mb-2">Reports & Intelligence</h2>
<p class="font-body-lg text-on-surface-variant max-w-2xl">Curated insights and precision analytics. Build bespoke data narratives or utilize our institutional standard templates.</p>
</div>
<div class="flex gap-3">
<button class="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border border-outline text-on-surface font-label-md hover:bg-surface-container transition-all">
<span class="material-symbols-outlined">upload_file</span>
                        Batch Export
                    </button>
<button class="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md shadow-lg hover:brightness-110 active:scale-95 transition-all">
<span class="material-symbols-outlined">add</span>
                        New Report Builder
                    </button>
</div>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-12 gap-6">
<!-- Main Analytics Visual (Wide) -->
<div class="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-secondary/20 shadow-sm bento-card flex flex-col relative overflow-hidden">
<div class="flex justify-between items-start mb-8 relative z-10">
<div>
<p class="text-caption text-secondary font-bold uppercase tracking-widest mb-1">Live Intelligence</p>
<h3 class="font-title-lg text-on-surface">Institutional Performance Index</h3>
</div>
<div class="flex bg-surface-container p-1 rounded-lg">
<button class="px-4 py-1.5 text-caption font-bold bg-white shadow-sm rounded-md">Weekly</button>
<button class="px-4 py-1.5 text-caption font-medium text-on-surface-variant hover:text-on-surface transition-colors">Monthly</button>
<button class="px-4 py-1.5 text-caption font-medium text-on-surface-variant hover:text-on-surface transition-colors">Quarterly</button>
</div>
</div>
<div class="h-64 w-full relative group">
<!-- Abstract Visualization Representation -->
<div class="absolute inset-0 flex items-end justify-between px-4 pb-4">
<div class="w-16 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg h-[40%]"></div>
<div class="w-16 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg h-[65%]"></div>
<div class="w-16 bg-primary/40 hover:bg-primary/60 transition-all rounded-t-lg h-[85%] border-t-4 border-secondary"></div>
<div class="w-16 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg h-[55%]"></div>
<div class="w-16 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg h-[95%]"></div>
<div class="w-16 bg-primary/30 hover:bg-primary/50 transition-all rounded-t-lg h-[75%]"></div>
<div class="w-16 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg h-[60%]"></div>
</div>
<div class="absolute inset-0 border-b border-outline-variant/30 flex flex-col justify-between">
<div class="w-full border-t border-outline-variant/10"></div>
<div class="w-full border-t border-outline-variant/10"></div>
<div class="w-full border-t border-outline-variant/10"></div>
<div class="w-full border-t border-outline-variant/10"></div>
</div>
</div>
<div class="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-outline-variant/20 relative z-10">
<div>
<p class="text-caption text-on-surface-variant">Active Enrollments</p>
<p class="font-display-md text-primary">12,482</p>
<p class="text-[10px] text-primary-container font-bold flex items-center gap-1 mt-1">
<span class="material-symbols-outlined text-[14px]">trending_up</span> +12.4% vs LY
                            </p>
</div>
<div>
<p class="text-caption text-on-surface-variant">Placement Rate</p>
<p class="font-display-md text-secondary">94.2%</p>
<p class="text-[10px] text-primary-container font-bold flex items-center gap-1 mt-1">
<span class="material-symbols-outlined text-[14px]">check_circle</span> Target Met
                            </p>
</div>
<div>
<p class="text-caption text-on-surface-variant">Grant Utilization</p>
<p class="font-display-md text-on-surface">87.5%</p>
<p class="text-[10px] text-on-surface-variant font-medium flex items-center gap-1 mt-1">
<span class="material-symbols-outlined text-[14px]">history</span> Ongoing audit
                            </p>
</div>
</div>
</div>
<!-- Featured Template Card -->
<div class="col-span-12 lg:col-span-4 bg-on-background p-8 rounded-xl shadow-lg bento-card text-white flex flex-col justify-between overflow-hidden relative">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
<div>
<div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
<span class="material-symbols-outlined text-secondary-fixed">account_balance</span>
</div>
<h3 class="font-title-lg text-secondary-fixed mb-4">Financial Audit</h3>
<p class="font-body-md text-white/70 mb-6">Complete end-of-year fiscal accountability report including grant tracking, infrastructure spending, and payroll reconciliation.</p>
<div class="space-y-3">
<div class="flex items-center gap-2 text-caption text-white/50">
<span class="material-symbols-outlined text-[16px]">verified</span> Verified for FY 24-25
                            </div>
<div class="flex items-center gap-2 text-caption text-white/50">
<span class="material-symbols-outlined text-[16px]">schedule</span> Estimated prep: 15 mins
                            </div>
</div>
</div>
<button class="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-label-md mt-8">Generate Financials</button>
</div>
<!-- Sub-Template 1 -->
<div class="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant bento-card">
<div class="flex justify-between items-start mb-6">
<div class="p-3 bg-surface-container rounded-full">
<span class="material-symbols-outlined text-primary">school</span>
</div>
<span class="px-3 py-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase rounded-full">Impact Report</span>
</div>
<h4 class="font-title-lg text-on-surface mb-2">Placement Impact</h4>
<p class="text-body-md text-on-surface-variant mb-6">Analyze long-term career progression and salary growth for alumni batches 2020-2023.</p>
<div class="flex items-center gap-4">
<button class="text-primary font-label-md hover:underline flex items-center gap-1">
                            Use Template <span class="material-symbols-outlined text-[16px]">chevron_right</span>
</button>
</div>
</div>
<!-- Sub-Template 2 -->
<div class="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant bento-card">
<div class="flex justify-between items-start mb-6">
<div class="p-3 bg-surface-container rounded-full">
<span class="material-symbols-outlined text-secondary">map</span>
</div>
<span class="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded-full">Regional</span>
</div>
<h4 class="font-title-lg text-on-surface mb-2">Regional Enrollment</h4>
<p class="text-body-md text-on-surface-variant mb-6">Geospatial distribution of applications and student density across participating districts.</p>
<div class="flex items-center gap-4">
<button class="text-primary font-label-md hover:underline flex items-center gap-1">
                            Use Template <span class="material-symbols-outlined text-[16px]">chevron_right</span>
</button>
</div>
</div>
<!-- Recent Exports Table -->
<div class="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant/50">
<h4 class="font-title-lg text-on-surface mb-6 flex items-center justify-between">
                        Recent Exports
                        <span class="material-symbols-outlined text-on-surface-variant cursor-pointer">more_horiz</span>
</h4>
<div class="space-y-4">
<!-- Export Item -->
<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-outline-variant/30 group hover:border-primary/40 transition-colors">
<div class="flex items-center gap-3">
<div class="w-10 h-10 bg-error-container/20 rounded flex items-center justify-center">
<span class="material-symbols-outlined text-error">picture_as_pdf</span>
</div>
<div>
<p class="font-label-md text-on-surface">Q3_Placement_Final.pdf</p>
<p class="text-[10px] text-on-surface-variant uppercase">Oct 12, 2023 • 4.2 MB</p>
</div>
</div>
<button class="opacity-0 group-hover:opacity-100 p-2 text-primary transition-opacity">
<span class="material-symbols-outlined">download</span>
</button>
</div>
<!-- Export Item -->
<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-outline-variant/30 group hover:border-primary/40 transition-colors">
<div class="flex items-center gap-3">
<div class="w-10 h-10 bg-primary-fixed/20 rounded flex items-center justify-center">
<span class="material-symbols-outlined text-primary">description</span>
</div>
<div>
<p class="font-label-md text-on-surface">Hostel_Capacity_Aug.csv</p>
<p class="text-[10px] text-on-surface-variant uppercase">Oct 08, 2023 • 1.1 MB</p>
</div>
</div>
<button class="opacity-0 group-hover:opacity-100 p-2 text-primary transition-opacity">
<span class="material-symbols-outlined">download</span>
</button>
</div>
<!-- Export Item -->
<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-outline-variant/30 group hover:border-primary/40 transition-colors">
<div class="flex items-center gap-3">
<div class="w-10 h-10 bg-error-container/20 rounded flex items-center justify-center">
<span class="material-symbols-outlined text-error">picture_as_pdf</span>
</div>
<div>
<p class="font-label-md text-on-surface">Audit_Report_2023_V2.pdf</p>
<p class="text-[10px] text-on-surface-variant uppercase">Sep 24, 2023 • 12.8 MB</p>
</div>
</div>
<button class="opacity-0 group-hover:opacity-100 p-2 text-primary transition-opacity">
<span class="material-symbols-outlined">download</span>
</button>
</div>
</div>
<button class="w-full mt-6 text-center text-caption font-bold text-on-surface-variant hover:text-primary transition-colors">View All Export History</button>
</div>
<!-- Custom Report Builder Interface (Experimental Glassmorphism section) -->
<div class="col-span-12 mt-6 relative rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
<div class="absolute inset-0 z-0">
<img class="w-full h-full object-cover grayscale opacity-20 group-hover:scale-105 transition-transform duration-[2s]" data-alt="A high-contrast, artistic overhead shot of architectural blueprints layered with semi-transparent digital data overlays. The image uses a palette of Sal Forest Green and Charcoal, with thin glowing Tasar Silk Gold lines representing data connections. The style is 'Museum Quality'—clean, structured, and evocative of deep intellectual rigor. Soft cinematic lighting with deep shadows creating a sense of tactile materiality." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkvpAMMIbRsR3D0Cf0Od0vdhcqXL4GoWngo99Ye0SPevUyTm_LTMBrzhyXqGyKtvEFrG9tVkdEI8Cp4AzamzYJb4JoZUSwQZUvAcRDdOGgLhkFhuy0xbs8AhnK5V1QbiZ1yDg7TcE8lszbl1_Yde1t4IF-QBy1ioaGzSWyVsItuyTLcKI-InHHtbEsgJ3YWo_4bAyL3PKTkTtxN_3R6D2tKzjBVNh4neqZl_MbfB2CJ8lTYbWcACAE"/>
<div class="absolute inset-0 bg-gradient-to-tr from-surface via-surface/90 to-transparent"></div>
</div>
<div class="relative z-10 glass-panel bg-white/40 border border-white/40 p-12 rounded-2xl max-w-4xl text-center shadow-2xl backdrop-blur-xl">
<span class="material-symbols-outlined text-primary text-5xl mb-6">analytics</span>
<h3 class="font-display-md text-on-background mb-4">Precision Intelligence Engine</h3>
<p class="font-body-lg text-on-surface-variant mb-10 max-w-xl mx-auto">Access the core SJKVY data lake. Combine multidimensional variables including enrollment velocity, facility overhead, and graduation outcomes into a single narrative.</p>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-10">
<div class="p-4 rounded-lg bg-white/60 border border-primary/10">
<p class="font-label-md text-primary mb-1">Dimension</p>
<p class="text-caption text-on-surface-variant">Select Region, Center, or Student Group</p>
</div>
<div class="p-4 rounded-lg bg-white/60 border border-primary/10">
<p class="font-label-md text-primary mb-1">Metric</p>
<p class="text-caption text-on-surface-variant">KPIs, Ratios, or Raw Values</p>
</div>
<div class="p-4 rounded-lg bg-white/60 border border-primary/10">
<p class="font-label-md text-primary mb-1">Format</p>
<p class="text-caption text-on-surface-variant">Interactive Heatmap, Table, or Chart</p>
</div>
</div>
<button class="px-10 py-4 bg-primary text-on-primary rounded-full font-label-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all shadow-lg inline-flex items-center gap-3">
<span class="material-symbols-outlined">rocket_launch</span>
                            Initialize Intelligence Builder
                        </button>
</div>
</div>
</div>
<!-- Footer Meta -->
<footer class="mt-24 pt-8 border-t border-outline-variant/30 flex justify-between items-center text-caption text-on-surface-variant">
<p>© 2024 Shri Jharkhand Kushal Vikas Yojana. Institutional Intelligence Division.</p>
<div class="flex gap-6">
<a class="hover:text-primary transition-colors" href="#">Privacy Protocol</a>
<a class="hover:text-primary transition-colors" href="#">Data Governance</a>
<a class="hover:text-primary transition-colors" href="#">System Status</a>
</div>
</footer>
</div>
</main>
<!-- FAB for Quick Export (Contextual Suppression Logic: Only here for Reports) -->
<button class="fixed bottom-10 right-10 w-14 h-14 bg-secondary-fixed text-on-secondary-fixed rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group">
<span class="material-symbols-outlined group-hover:rotate-12 transition-transform">download</span>
<div class="absolute bottom-full right-0 mb-4 bg-on-background text-white py-2 px-4 rounded text-caption whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Quick Export Dashboard
        </div>
</button>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bento-card {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(26, 28, 30, 0.08);
        }
        .glass-panel {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c9bf; border-radius: 10px; }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
