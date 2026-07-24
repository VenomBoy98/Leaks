// GENERATED from handoff app/student-profile.html — do not edit by hand. Regenerate: npm run convert
export const portal = "student";
export const title = "SJKVY Student Profile | Institutional Portal";
export const html = `<!-- Sidebar Navigation -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-on-tertiary-fixed-variant dark:bg-on-tertiary-fixed-variant border-r border-secondary-fixed/10 shadow-sm flex flex-col py-base z-50">
<div class="px-6 py-8">
<h1 class="font-headline-lg text-headline-lg text-on-secondary mb-1">SJKVY Portal</h1>
<p class="font-caption text-caption text-tertiary-fixed opacity-70">Institutional Access</p>
</div>
<nav class="flex-grow px-4 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
<!-- Navigation Items Mapping -->
<a class="flex items-center gap-4 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-body-md text-body-md">Dashboard</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">calendar_today</span>
<span class="font-body-md text-body-md">Attendance</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">apartment</span>
<span class="font-body-md text-body-md">Hostel</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">assignment</span>
<span class="font-body-md text-body-md">Assessments</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">workspace_premium</span>
<span class="font-body-md text-body-md">Certificates</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">work_outline</span>
<span class="font-body-md text-body-md">Placement</span>
</a>
<!-- Active State: Profile -->
<a class="flex items-center gap-4 px-4 py-3 border-l-4 border-secondary-fixed text-on-secondary bg-primary-container/20 transition-all duration-200 cursor-pointer active:scale-95 group" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-body-md text-body-md">Profile</span>
</a>
</nav>
<div class="px-6 py-6 border-t border-secondary-fixed/10">
<button class="w-full py-3 bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
<span class="material-symbols-outlined text-[18px]">help_outline</span>
                Support Desk
            </button>
</div>
</aside>
<!-- Top Navigation Bar -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-[72px] bg-surface/60 backdrop-blur-md z-40 flex justify-between items-center px-margin-desktop shadow-[0_4px_20px_rgba(26,28,30,0.04)]">
<div class="flex items-center gap-8">
<span class="font-display-md text-display-md text-primary">SJKVY</span>
<nav class="hidden md:flex gap-6">
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Resources</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
</nav>
</div>
<div class="flex items-center gap-6">
<div class="relative group">
<span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
<input class="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 w-64 font-body-md text-body-md focus:ring-1 focus:ring-primary" placeholder="Search resources..." type="text"/>
</div>
<div class="flex gap-4 border-l border-outline-variant/30 pl-6">
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">settings</button>
<div class="w-10 h-10 rounded-full bg-secondary-container overflow-hidden border border-secondary-fixed/20 cursor-pointer">
<img class="w-full h-full object-cover" data-alt="A dignified close-up portrait of a student in a bright, modern educational setting with soft golden lighting. The composition is professional yet warm, using a shallow depth of field to emphasize the subject. The color palette incorporates soft ivories, deep greens, and warm bronze highlights to match the institutional brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdG8bucwSEVxdZ1wjrzyH6dw1keK1nwneSkQSj3bc-uBBG0XQT9X_Lj6Aph90wUQuIrG2YsCs1fuFt4UltMYAJVvlbXlN6B6nAzHInMnbyKIbFutrnQqB0qTPWhGjYLB3ZF6-MVMyNzUhzTnJfyvKOjVBDBkOpRsyQ6WAUOvjlpCCjSgfTY6-Ro44jtrRjbgjObRaWGLyEQEZhS2bUwbXn1gDqTTI2wzrPqdUs13MaU5kbVrr4qSlk"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-[280px] pt-[72px] min-h-screen px-margin-desktop py-12 max-w-1440px mx-auto bg-background">
<!-- Profile Header Section -->
<section class="mb-12 flex flex-col md:flex-row gap-12 items-start opacity-0 translate-y-4 transition-all duration-700 ease-out" id="header-section">
<div class="relative">
<div class="w-48 h-48 rounded-full border-[6px] border-surface-container-high shadow-xl overflow-hidden relative group">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="A high-quality institutional portrait of a young professional student against a minimalist, warm ivory background. The lighting is soft and architectural, creating a serene and intelligent atmosphere. The aesthetic is clean, museum-quality, and follows a palette of muted golds and deep greens." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIDleylEjEM6D1dvCoTTfKb5vfFfrFgKXhPP5K5yW4G7qqgrTmamXQai76d2AbDa-MCRdyxM6ft9zfnQqqr2JcuOAYb7-St7ZDnSqhm1o3szNj4Oi2QAEqOosLXW6sfZsiiNR3Y2_waQeKc4_9od0KubHriFesFzOKOSdJyK4YNzQc1t3_1PqL1WIUVMlGnyCFujsigl5ooImEDVRvKDt73EsQzQnpmGFpfOEQ8BGH26SPxLPMRWJ3"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
<span class="material-symbols-outlined text-white text-3xl">edit</span>
</div>
</div>
<div class="absolute bottom-2 right-2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
<span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">verified</span>
</div>
</div>
<div class="flex-grow pt-4">
<div class="flex justify-between items-start">
<div>
<h2 class="font-headline-lg text-headline-lg text-on-surface mb-2">Aravind Sharma</h2>
<p class="font-title-lg text-title-lg text-primary mb-4">Roll No: SJK-2024-00892</p>
<div class="flex flex-wrap gap-3">
<span class="px-4 py-1.5 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-md text-label-md border border-secondary-container/50">Senior Fellow</span>
<span class="px-4 py-1.5 rounded-full bg-primary-container/10 text-primary font-label-md text-label-md border border-primary-container/20">Data Sciences</span>
<span class="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md">Batch 2024-C</span>
</div>
</div>
<div class="flex gap-4">
<button class="px-6 py-3 border border-secondary text-secondary font-label-md text-label-md rounded hover:bg-secondary/5 transition-all active:scale-95">Download ID</button>
<button class="px-6 py-3 bg-primary text-on-primary font-label-md text-label-md rounded shadow-sm hover:bg-primary/90 transition-all active:scale-95">Share Profile</button>
</div>
</div>
</div>
</section>
<!-- Bento Grid Layout -->
<div class="bento-grid">
<!-- Personal Information Card -->
<div class="col-span-12 lg:col-span-8 bg-surface border-t-2 border-primary shadow-[0_4px_20px_rgba(26,28,30,0.04)] p-8 opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100" id="personal-info">
<div class="flex justify-between items-center mb-8">
<h3 class="font-title-lg text-title-lg text-primary flex items-center gap-2">
<span class="material-symbols-outlined">badge</span>
                        Identity Details
                    </h3>
<button class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-label-md text-label-md">
<span class="material-symbols-outlined text-[16px]">edit</span>
                        Modify
                    </button>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
<div class="space-y-1">
<p class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Email Address</p>
<p class="font-body-lg text-body-lg text-on-surface">aravind.sharma@sjkvy.edu.in</p>
</div>
<div class="space-y-1">
<p class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Mobile Number</p>
<p class="font-body-lg text-body-lg text-on-surface">+91 98765 43210</p>
</div>
<div class="space-y-1 border-t border-outline-variant/10 pt-4">
<p class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Date of Birth</p>
<p class="font-body-lg text-body-lg text-on-surface">May 14, 2002</p>
</div>
<div class="space-y-1 border-t border-outline-variant/10 pt-4">
<p class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Blood Group</p>
<p class="font-body-lg text-body-lg text-on-surface">O Positive</p>
</div>
<div class="col-span-2 space-y-1 border-t border-outline-variant/10 pt-4">
<p class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Permanent Address</p>
<p class="font-body-lg text-body-lg text-on-surface leading-relaxed">
                            Plot 42, Green Valley Enclave, Sector 15-B, New Delhi, India - 110001
                        </p>
</div>
</div>
</div>
<!-- Skills Radar Chart Section -->
<div class="col-span-12 lg:col-span-4 bg-surface-container-low shadow-[0_4px_20px_rgba(26,28,30,0.04)] p-8 flex flex-col opacity-0 translate-y-4 transition-all duration-700 ease-out delay-200" id="skills-radar">
<h3 class="font-title-lg text-title-lg text-on-surface mb-8">Competency Radar</h3>
<div class="relative flex-grow flex items-center justify-center py-6">
<!-- Simple Interactive Radar Representation -->
<div class="w-full aspect-square relative border border-secondary/10 rounded-full flex items-center justify-center">
<!-- Concentric circles for depth -->
<div class="absolute w-[80%] h-[80%] border border-secondary/10 rounded-full"></div>
<div class="absolute w-[60%] h-[60%] border border-secondary/10 rounded-full"></div>
<div class="absolute w-[40%] h-[40%] border border-secondary/10 rounded-full"></div>
<!-- Radar Shape (Static for visual intent) -->
<div class="radar-chart absolute inset-12 bg-primary/20 border border-primary/40 backdrop-blur-sm transform rotate-45 transition-all hover:scale-105 duration-500"></div>
<!-- Labels -->
<span class="absolute top-0 font-label-md text-label-md text-primary">Technical</span>
<span class="absolute right-0 font-label-md text-label-md text-primary">Leadership</span>
<span class="absolute bottom-0 font-label-md text-label-md text-primary">Soft Skills</span>
<span class="absolute left-0 font-label-md text-label-md text-primary">Theory</span>
</div>
</div>
<div class="mt-6 space-y-4">
<div class="flex justify-between items-center">
<span class="font-body-md text-body-md text-on-surface-variant">Academic Excellence</span>
<span class="font-label-md text-label-md text-primary bg-primary/10 px-2 py-0.5 rounded">Top 5%</span>
</div>
<div class="w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
<div class="bg-primary h-full w-[92%] transition-all duration-1000"></div>
</div>
</div>
</div>
<!-- Academic Track Card -->
<div class="col-span-12 lg:col-span-12 bg-surface shadow-[0_4px_20px_rgba(26,28,30,0.04)] p-0 overflow-hidden opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300" id="academic-track">
<div class="p-8 border-b border-outline-variant/10 bg-white">
<h3 class="font-title-lg text-title-lg text-primary flex items-center gap-2">
<span class="material-symbols-outlined">timeline</span>
                        Academic Journey
                    </h3>
</div>
<div class="p-8 overflow-x-auto">
<table class="w-full text-left">
<thead>
<tr class="border-b border-outline-variant/20">
<th class="pb-4 font-label-md text-label-md text-primary uppercase tracking-wider">Semester</th>
<th class="pb-4 font-label-md text-label-md text-primary uppercase tracking-wider">Major Subject</th>
<th class="pb-4 font-label-md text-label-md text-primary uppercase tracking-wider">CGPA</th>
<th class="pb-4 font-label-md text-label-md text-primary uppercase tracking-wider">Status</th>
<th class="pb-4 font-label-md text-label-md text-primary uppercase tracking-wider">Action</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/10">
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="py-6 font-body-md text-body-md font-semibold text-on-surface">Fall 2023</td>
<td class="py-6 font-body-md text-body-md text-on-surface">Advanced Algorithms & Analytics</td>
<td class="py-6 font-body-md text-body-md font-bold text-secondary">9.2 / 10</td>
<td class="py-6">
<span class="px-3 py-1 rounded-full bg-on-primary-fixed-variant/10 text-on-primary-fixed-variant font-label-md text-label-md">Completed</span>
</td>
<td class="py-6">
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary">download</button>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="py-6 font-body-md text-body-md font-semibold text-on-surface">Spring 2024</td>
<td class="py-6 font-body-md text-body-md text-on-surface">Human-Computer Interaction</td>
<td class="py-6 font-body-md text-body-md font-bold text-secondary">8.9 / 10</td>
<td class="py-6">
<span class="px-3 py-1 rounded-full bg-primary-container/10 text-primary font-label-md text-label-md">In Progress</span>
</td>
<td class="py-6">
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary">visibility</button>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="py-6 font-body-md text-body-md font-semibold text-on-surface">Summer 2024</td>
<td class="py-6 font-body-md text-body-md text-on-surface">Quantum Computation Basics</td>
<td class="py-6 font-body-md text-body-md font-bold text-secondary">--</td>
<td class="py-6">
<span class="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-label-md">Enrolled</span>
</td>
<td class="py-6">
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary">info</button>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<!-- Settings / Quick Actions -->
<div class="col-span-12 lg:col-span-6 bg-surface shadow-[0_4px_20px_rgba(26,28,30,0.04)] p-8 opacity-0 translate-y-4 transition-all duration-700 ease-out delay-400" id="account-settings">
<h3 class="font-title-lg text-title-lg text-primary mb-6">Security & Preferences</h3>
<div class="space-y-6">
<div class="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/10">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-primary">key</span>
<div>
<p class="font-body-md text-body-md font-bold">Two-Factor Authentication</p>
<p class="font-caption text-caption text-on-surface-variant">Recommended for high-security accounts</p>
</div>
</div>
<div class="w-12 h-6 bg-primary rounded-full relative cursor-pointer shadow-inner">
<div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
</div>
</div>
<div class="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant/10">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-primary">visibility</span>
<div>
<p class="font-body-md text-body-md font-bold">Privacy Controls</p>
<p class="font-caption text-caption text-on-surface-variant">Manage who can see your academic track</p>
</div>
</div>
<button class="text-primary font-label-md text-label-md uppercase tracking-widest hover:underline">Manage</button>
</div>
</div>
</div>
<!-- Support Status -->
<div class="col-span-12 lg:col-span-6 bg-surface shadow-[0_4px_20px_rgba(26,28,30,0.04)] p-8 opacity-0 translate-y-4 transition-all duration-700 ease-out delay-500" id="support-status">
<h3 class="font-title-lg text-title-lg text-primary mb-6">Recent Tickets</h3>
<div class="space-y-4">
<div class="flex items-center gap-4 py-3 border-b border-outline-variant/10">
<div class="w-10 h-10 rounded bg-error-container/20 flex items-center justify-center text-error">
<span class="material-symbols-outlined">report_problem</span>
</div>
<div class="flex-grow">
<p class="font-body-md text-body-md font-semibold">Mess Fee Discrepancy</p>
<p class="font-caption text-caption text-on-surface-variant">Ticket #T-8892 • 2 days ago</p>
</div>
<span class="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-md text-label-md">Critical</span>
</div>
<div class="flex items-center gap-4 py-3">
<div class="w-10 h-10 rounded bg-secondary-container/20 flex items-center justify-center text-secondary">
<span class="material-symbols-outlined">task_alt</span>
</div>
<div class="flex-grow">
<p class="font-body-md text-body-md font-semibold">Library Clearance</p>
<p class="font-caption text-caption text-on-surface-variant">Ticket #T-8841 • Resolved</p>
</div>
<span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-md text-label-md">Closed</span>
</div>
</div>
<button class="w-full mt-6 py-3 border border-dashed border-outline-variant text-on-surface-variant font-label-md text-label-md rounded hover:bg-surface-container-low transition-colors">
                    + Raise New Request
                </button>
</div>
</div>
</main>
<!-- Footer -->
<footer class="relative w-full py-8 bg-surface-container border-t border-outline-variant/20 mt-12 ml-[280px] w-[calc(100%-280px)]">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-1440px mx-auto">
<div class="mb-4 md:mb-0">
<p class="font-label-md text-label-md text-primary mb-1">SJKVY</p>
<p class="font-caption text-caption text-on-surface-variant opacity-70">© 2024 SJKVY Institutional Portal. All rights reserved.</p>
</div>
<div class="flex gap-8">
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Privacy Policy</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Terms of Service</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Institutional Contacts</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">FAQ</a>
</div>
</div>
</footer>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 24px;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(119, 90, 25, 0.2);
            border-radius: 10px;
        }
        .radar-chart {
            clip-path: polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%);
        }
        .glass-effect {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
