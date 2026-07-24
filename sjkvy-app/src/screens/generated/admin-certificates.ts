// GENERATED from handoff app/admin-certificates.html — do not edit by hand. Regenerate: npm run convert
export const portal = "admin";
export const title = "Certificate Management | SJKVY Portal";
export const html = `<!-- Sidebar Navigation Shell -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-xl flex flex-col py-stack-lg z-50">
<div class="px-6 py-8">
<h1 class="font-display-md text-secondary-fixed tracking-tight leading-none">SJKVY Portal</h1>
<p class="text-on-primary/60 font-label-md mt-2 uppercase tracking-widest text-[10px]">Centre Admin</p>
</div>
<nav class="flex-grow mt-4">
<ul class="space-y-1">
<li>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 bg-white/10 text-secondary-fixed font-bold border-l-4 border-secondary-fixed" href="#">
<span class="material-symbols-outlined mr-4">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">group</span>
<span class="font-label-md">Directory</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">assessment</span>
<span class="font-label-md">Reports</span>
</a>
</li>
</ul>
</nav>
<div class="px-6 py-8 mt-auto border-t border-white/10">
<button class="w-full py-3 px-4 bg-secondary-fixed text-on-secondary-fixed font-label-md rounded shadow-md hover:scale-98 transition-transform duration-200">
                Quick Enroll
            </button>
<div class="mt-6 flex flex-col space-y-3">
<a class="flex items-center text-on-primary/60 hover:text-on-primary text-sm transition-colors" href="#">
<span class="material-symbols-outlined text-sm mr-2">settings</span> Settings
                </a>
<a class="flex items-center text-on-primary/60 hover:text-on-primary text-sm transition-colors" href="#">
<span class="material-symbols-outlined text-sm mr-2">help</span> Support
                </a>
</div>
</div>
</aside>
<!-- Main Content Layout -->
<main class="ml-72 min-h-screen">
<!-- Top App Bar -->
<header class="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-gutter h-20">
<div class="flex items-center bg-surface-container-low rounded-full px-4 py-2 w-96">
<span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
<input class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-on-surface-variant/50" placeholder="Search certificates or students..." type="text"/>
</div>
<div class="flex items-center space-x-6">
<button class="relative text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="flex items-center space-x-3 pl-4 border-l border-outline-variant">
<div class="text-right">
<p class="text-sm font-bold text-on-surface">Vikram Singh</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-tighter">Centre Admin</p>
</div>
<img class="w-10 h-10 rounded-full object-cover border-2 border-primary/20" data-alt="A professional studio portrait of a South Asian male administrator in a tailored charcoal suit, set against a warm, neutrally lit architectural background with soft bokeh. The lighting is elegant and soft, reflecting a premium museum-quality corporate aesthetic with subtle bronze and ivory tones in the environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIRtepv3hDgSR6PQXJpbI5SSeDiwybjXHMYMxfll5kt8zKCNJGBYLgs-4I6-RYpMSNQP1mjbF6xX8n8pGVib-qyoH85oXoPkZJC7uKuGZNzGMF5iKePlCQyhwsy3qHZ4-egTcuxT2jsu2hfYGMBrVs_e4WxaRfrBP1lCs-qO4z3sFis7xm8CGKdYJJd95WpU9ypNzvSG1YYCLfDnAvwPnTDRTPQxvTVrHGM-oJOV_YaCvDh7x9JBx9"/>
</div>
</div>
</header>
<!-- Dashboard Body -->
<div class="p-margin-desktop max-w-max-width mx-auto">
<!-- Hero Header -->
<section class="mb-12 stagger-entry" style="animation-delay: 0.1s;">
<h2 class="font-display-lg text-primary mb-2">Certificate Management</h2>
<p class="font-body-lg text-on-surface-variant max-w-2xl">Secure institutional repository for the generation, digital signing, and archival verification of professional certifications.</p>
</section>
<!-- Bento Grid Stats & Actions -->
<div class="grid grid-cols-12 gap-6 mb-12">
<!-- Quick Issue Card -->
<div class="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-8 museum-shadow border-t-2 border-primary relative overflow-hidden stagger-entry" style="animation-delay: 0.2s;">
<div class="relative z-10 flex flex-col h-full justify-between">
<div>
<div class="flex items-center justify-between mb-6">
<span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Issue New</span>
<span class="material-symbols-outlined text-secondary">verified_user</span>
</div>
<h3 class="font-title-lg text-on-surface mb-2">Issue Institutional Certificate</h3>
<p class="text-on-surface-variant mb-8 max-w-md">Launch the wizard to generate a tamper-proof digital certificate for verified alumni or course completions.</p>
</div>
<button class="inline-flex items-center justify-center bg-primary text-on-primary px-6 py-3 rounded font-label-md hover:bg-primary-container transition-colors w-max" onclick="toggleWizard()">
                            Start Issue Wizard
                            <span class="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
</button>
</div>
<!-- Subtle background graphic -->
<div class="absolute -right-16 -bottom-16 opacity-[0.03] pointer-events-none">
<span class="material-symbols-outlined text-[240px]" style="font-variation-settings: 'wght' 100;">military_tech</span>
</div>
</div>
<!-- Verification Quick Stats -->
<div class="col-span-12 md:col-span-4 grid grid-rows-2 gap-6">
<div class="bg-surface-container-high rounded-xl p-6 museum-shadow border border-outline-variant/20 stagger-entry" style="animation-delay: 0.3s;">
<p class="text-on-surface-variant font-label-md uppercase text-[10px] tracking-widest mb-1">Verification Activity</p>
<p class="text-display-md text-primary font-bold">1,284</p>
<div class="flex items-center mt-2 text-primary text-xs font-bold">
<span class="material-symbols-outlined text-sm mr-1">trending_up</span>
                            +12% this month
                        </div>
</div>
<div class="bg-surface-container-high rounded-xl p-6 museum-shadow border border-outline-variant/20 stagger-entry" style="animation-delay: 0.4s;">
<p class="text-on-surface-variant font-label-md uppercase text-[10px] tracking-widest mb-1">Digital Signatures</p>
<div class="flex items-center space-x-2">
<span class="text-display-md text-on-surface font-bold">Active</span>
<span class="w-3 h-3 bg-secondary rounded-full animate-pulse"></span>
</div>
<p class="text-caption mt-2 text-on-surface-variant">Last secured: 2 mins ago via HSM</p>
</div>
</div>
<!-- Verification Log Table -->
<div class="col-span-12 bg-white rounded-xl museum-shadow stagger-entry overflow-hidden" style="animation-delay: 0.5s;">
<div class="p-6 bronze-divider flex justify-between items-center">
<h3 class="font-title-lg text-primary">Recent Verification Logs</h3>
<button class="text-primary font-label-md text-sm flex items-center hover:underline">
                            View full audit trail <span class="material-symbols-outlined ml-1 text-sm">open_in_new</span>
</button>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead class="bg-surface-container-low">
<tr>
<th class="px-6 py-4 font-label-md text-on-surface-variant uppercase text-[10px] tracking-widest">Certificate ID</th>
<th class="px-6 py-4 font-label-md text-on-surface-variant uppercase text-[10px] tracking-widest">Recipient</th>
<th class="px-6 py-4 font-label-md text-on-surface-variant uppercase text-[10px] tracking-widest">Verifier Entity</th>
<th class="px-6 py-4 font-label-md text-on-surface-variant uppercase text-[10px] tracking-widest">Status</th>
<th class="px-6 py-4 font-label-md text-on-surface-variant uppercase text-[10px] tracking-widest text-right">Timestamp</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/10">
<tr class="hover:bg-surface-container-lowest transition-colors">
<td class="px-6 py-4 font-mono text-sm text-primary">CERT-2023-9812</td>
<td class="px-6 py-4">
<p class="font-bold text-on-surface">Aditi Sharma</p>
<p class="text-xs text-on-surface-variant">Batch 2023-A</p>
</td>
<td class="px-6 py-4 text-on-surface-variant">Ministry of Education</td>
<td class="px-6 py-4">
<span class="flex items-center text-primary text-xs font-bold">
<span class="material-symbols-outlined text-sm mr-1" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                                            Verified
                                        </span>
</td>
<td class="px-6 py-4 text-right text-caption text-on-surface-variant">Oct 24, 14:22</td>
</tr>
<tr class="hover:bg-surface-container-lowest transition-colors">
<td class="px-6 py-4 font-mono text-sm text-primary">CERT-2023-7741</td>
<td class="px-6 py-4">
<p class="font-bold text-on-surface">Rohan Verma</p>
<p class="text-xs text-on-surface-variant">Batch 2022-C</p>
</td>
<td class="px-6 py-4 text-on-surface-variant">TechCorp Global Solutions</td>
<td class="px-6 py-4">
<span class="flex items-center text-primary text-xs font-bold">
<span class="material-symbols-outlined text-sm mr-1" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                                            Verified
                                        </span>
</td>
<td class="px-6 py-4 text-right text-caption text-on-surface-variant">Oct 24, 11:05</td>
</tr>
<tr class="hover:bg-surface-container-lowest transition-colors">
<td class="px-6 py-4 font-mono text-sm text-primary">CERT-2023-1102</td>
<td class="px-6 py-4">
<p class="font-bold text-on-surface">Priya Kapur</p>
<p class="text-xs text-on-surface-variant">Batch 2023-B</p>
</td>
<td class="px-6 py-4 text-on-surface-variant">Public Verification Portal</td>
<td class="px-6 py-4">
<span class="flex items-center text-secondary text-xs font-bold">
<span class="material-symbols-outlined text-sm mr-1">history</span>
                                            Pending Audit
                                        </span>
</td>
<td class="px-6 py-4 text-right text-caption text-on-surface-variant">Oct 23, 17:45</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<!-- Signature Status Panel -->
<section class="stagger-entry" style="animation-delay: 0.6s;">
<div class="bg-on-background rounded-xl p-8 text-inverse-on-surface flex flex-col md:flex-row items-center justify-between">
<div class="mb-6 md:mb-0">
<h4 class="font-title-lg mb-2 flex items-center">
<span class="material-symbols-outlined mr-2 text-secondary-fixed">security</span>
                            Digital Signature Engine Status
                        </h4>
<p class="text-sm opacity-70">Hardware Security Module (HSM) connected. All issued certificates are cryptographically signed with RSA-4096 keys.</p>
</div>
<div class="flex items-center space-x-4">
<div class="text-right">
<p class="text-xs opacity-50 uppercase tracking-widest">Uptime</p>
<p class="font-bold">99.998%</p>
</div>
<div class="h-10 w-[1px] bg-white/20"></div>
<button class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors">
                            Manage Keys
                        </button>
</div>
</div>
</section>
</div>
</main>
<!-- Issue Wizard Modal (Overlay) -->
<div class="fixed inset-0 z-[100] hidden items-center justify-center p-6 bg-on-background/40 backdrop-blur-sm" id="issue-modal">
<div class="bg-surface w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col stagger-entry">
<!-- Header -->
<div class="px-8 py-6 bg-primary text-on-primary flex justify-between items-center">
<div>
<h3 class="font-display-md text-2xl">Issue Certificate Wizard</h3>
<p class="text-on-primary/70 text-xs">Step 1 of 3: Recipient &amp; Course Details</p>
</div>
<button class="text-on-primary/50 hover:text-on-primary transition-colors" onclick="toggleWizard()">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<div class="flex flex-grow">
<!-- Left: Form -->
<div class="w-full md:w-2/3 p-10">
<div class="space-y-6">
<div class="grid grid-cols-2 gap-6">
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant block uppercase text-[10px] tracking-widest">Student Enrollment ID</label>
<input class="w-full bg-surface-container-low border-outline-variant/30 rounded px-4 py-3 text-sm focus:ring-primary focus:border-primary" placeholder="e.g. SJKVY-2023-4402" type="text"/>
</div>
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant block uppercase text-[10px] tracking-widest">Issue Date</label>
<input class="w-full bg-surface-container-low border-outline-variant/30 rounded px-4 py-3 text-sm focus:ring-primary focus:border-primary" type="date"/>
</div>
</div>
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant block uppercase text-[10px] tracking-widest">Full Recipient Name</label>
<input class="w-full bg-surface-container-low border-outline-variant/30 rounded px-4 py-3 text-sm focus:ring-primary focus:border-primary" placeholder="As it should appear on certificate" type="text"/>
</div>
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant block uppercase text-[10px] tracking-widest">Course / Certification Title</label>
<select class="w-full bg-surface-container-low border-outline-variant/30 rounded px-4 py-3 text-sm focus:ring-primary focus:border-primary">
<option>Advanced Vocational Excellence - Tier I</option>
<option>Digital Literacy &amp; Financial Management</option>
<option>Community Leadership &amp; Governance</option>
</select>
</div>
<div class="pt-8 flex justify-between border-t border-outline-variant/20 mt-10">
<button class="px-6 py-2 text-on-surface-variant font-label-md hover:text-on-surface" onclick="toggleWizard()">Cancel</button>
<button class="bg-primary text-on-primary px-8 py-3 rounded font-label-md shadow-lg flex items-center">
                                Next: Digital Signature
                                <span class="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
</button>
</div>
</div>
</div>
<!-- Right: Preview -->
<div class="hidden md:block w-1/3 bg-surface-container p-10 border-l border-outline-variant/20">
<p class="font-label-md text-on-surface-variant uppercase text-[10px] tracking-widest mb-6 text-center">Live Preview</p>
<div class="aspect-[1/1.414] bg-white border-[12px] border-secondary-container/20 p-4 shadow-lg flex flex-col items-center justify-between relative">
<div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
<span class="material-symbols-outlined text-primary text-xl">account_balance</span>
</div>
<div class="text-center space-y-1">
<div class="h-1 w-16 bg-outline-variant/30 mx-auto rounded"></div>
<div class="h-1 w-24 bg-outline-variant/30 mx-auto rounded"></div>
</div>
<div class="w-full space-y-2">
<div class="h-2 w-3/4 bg-on-background/10 mx-auto rounded"></div>
<div class="h-2 w-1/2 bg-on-background/10 mx-auto rounded"></div>
</div>
<div class="w-full flex justify-between px-2 pt-4">
<div class="w-8 h-8 rounded border border-outline-variant/30"></div>
<div class="w-12 h-4 bg-outline-variant/20 rounded"></div>
</div>
</div>
<p class="text-caption text-on-surface-variant mt-6 text-center italic">Institutional watermark and QR code will be auto-generated in the final step.</p>
</div>
</div>
</div>
</div>
<!-- Notification Toast -->
<div class="fixed bottom-8 right-8 z-[110] bg-on-background text-inverse-on-surface px-6 py-4 rounded shadow-2xl flex items-center border-l-4 border-secondary translate-y-20 opacity-0 transition-all duration-500" id="toast">
<span class="material-symbols-outlined mr-3 text-secondary-fixed">info</span>
<div>
<p class="font-bold text-sm">System Alert</p>
<p class="text-xs opacity-70">HSM Maintenance scheduled for 02:00 AM UTC.</p>
</div>
</div>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
        }
        .museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .bronze-divider {
            border-bottom: 1px solid rgba(119, 90, 25, 0.1);
        }
        .glass-panel {
            backdrop-filter: blur(12px);
            background: rgba(252, 249, 248, 0.6);
        }
        .stagger-entry {
            animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            opacity: 0;
        }
        @keyframes slideUp {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
