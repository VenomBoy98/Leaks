// GENERATED from handoff app/counselling.html — do not edit by hand. Regenerate: npm run convert
export const portal = "staff";
export const title = "SJKVY Institutional Portal | Counselling Management";
export const html = `<!-- TopNavBar (Shared Component) -->
<header class="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-md shadow-sm">
<div class="flex justify-between items-center h-topbar-height px-margin-desktop max-w-max-width mx-auto">
<div class="flex items-center gap-8">
<h1 class="font-display-md text-display-md text-primary">SJKVY</h1>
<nav class="hidden md:flex gap-6">
<a class="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="#">Directory</a>
<a class="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="#">Resources</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="relative hidden sm:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
<input class="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-md focus:ring-2 focus:ring-primary w-64 transition-all" placeholder="Search portal..." type="text"/>
</div>
<button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed ml-2">
<img class="w-full h-full object-cover" data-alt="Close-up portrait of a professional academic staff member in a bright, modern office setting. The lighting is soft and warm, highlighting the professional yet approachable atmosphere. The background features blurred books and a clean, minimalist interior with ivory and green accents, reflecting the SJKVY brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5XLpRNwaDGt2s9ogeFb18HLmpxyK9LI8hRoa17CfAiByLRufD04qtdlN_3gHpS9YkyRb0JqglQWzamMjIU-JwrquP992UX3J_4xOtJetA8kPwQ6lPKBJCcGjFjI2qdcz5guRpdkhd9nkZ6Gzm2FNvitN0rGr9_9WhrUpygK6VoQleGuYC41WfBOqAJ4p8W4lzKBBPCsKs-YxLXvkynRymED2pPeEjcUiWKkgj96UdeLu--7cY96jW"/>
</div>
</div>
</div>
</header>
<!-- SideNavBar (Shared Component) -->
<aside class="fixed left-0 top-0 h-full w-sidebar-width bg-on-background flex flex-col py-8 z-40 border-r border-outline-variant/20">
<div class="px-6 mb-12">
<h2 class="font-headline-lg text-headline-lg text-surface">SJKVY Staff</h2>
<p class="text-tertiary-fixed-dim font-label-md text-label-md tracking-wider mt-1 uppercase">Institutional Portal</p>
</div>
<nav class="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
<!-- Dashboard Tab -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md text-label-md">Dashboard</span>
</div>
<!-- Verification Tab -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">verified_user</span>
<span class="font-label-md text-label-md">Verification</span>
</div>
<!-- Counselling Tab (ACTIVE) -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 border-l-4 border-secondary text-surface font-semibold bg-primary-fixed-variant/10">
<span class="material-symbols-outlined">groups</span>
<span class="font-label-md text-label-md">Counselling</span>
</div>
<!-- Attendance Tab -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">co_present</span>
<span class="font-label-md text-label-md">Attendance</span>
</div>
<!-- Hostel Tab -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">apartment</span>
<span class="font-label-md text-label-md">Hostel</span>
</div>
<!-- Placement Tab -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">work</span>
<span class="font-label-md text-label-md">Placement</span>
</div>
<!-- Reports Tab -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md text-label-md">Reports</span>
</div>
</nav>
<div class="px-6 pt-8 mt-auto border-t border-white/10">
<div class="flex items-center gap-4 py-3 text-tertiary-fixed-dim hover:text-surface cursor-pointer">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</div>
<div class="flex items-center gap-4 py-3 text-tertiary-fixed-dim hover:text-error transition-colors cursor-pointer">
<span class="material-symbols-outlined">logout</span>
<span class="font-label-md text-label-md">Logout</span>
</div>
<div class="mt-6 bg-primary-container/20 rounded-xl p-4">
<p class="text-primary-fixed font-label-md text-[10px] uppercase tracking-widest mb-1">System Status</p>
<div class="flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
<span class="text-surface text-caption font-caption">Operational</span>
</div>
</div>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="ml-[280px] pt-[72px] min-h-screen">
<div class="max-w-max-width mx-auto p-margin-desktop">
<!-- Header Section -->
<header class="flex justify-between items-end mb-10 animate-fade-up">
<div>
<h2 class="font-display-md text-display-md text-primary mb-2">Counselling Management</h2>
<p class="text-on-surface-variant font-body-lg text-body-lg">Organize appointments and mentor future professionals.</p>
</div>
<button class="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md flex items-center gap-3 hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/10">
<span class="material-symbols-outlined text-[18px]">add</span>
                    Schedule Session
                </button>
</header>
<!-- Grid Layout -->
<div class="grid grid-cols-12 gap-gutter">
<!-- Left Column: Upcoming & Forms (Bento Style) -->
<div class="col-span-12 lg:col-span-7 space-y-gutter">
<!-- Session Notes Card (Form) -->
<section class="bg-white rounded-xl p-8 shadow-sm border-t-2 border-primary animate-fade-up" style="animation-delay: 0.1s">
<div class="flex items-center gap-3 mb-6">
<span class="material-symbols-outlined text-secondary">history_edu</span>
<h3 class="font-title-lg text-title-lg text-on-surface">Active Session: Counselling Notes</h3>
</div>
<form class="space-y-6">
<div class="grid grid-cols-2 gap-4">
<div class="space-y-1">
<label class="font-label-md text-label-md text-on-surface-variant uppercase">Student ID</label>
<input class="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:border-primary focus:ring-0 transition-all font-body-md" type="text" value="SJK-2024-089"/>
</div>
<div class="space-y-1">
<label class="font-label-md text-label-md text-on-surface-variant uppercase">Date of Session</label>
<input class="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:border-primary focus:ring-0 transition-all font-body-md" type="date" value="2024-10-24"/>
</div>
</div>
<div class="space-y-1">
<label class="font-label-md text-label-md text-on-surface-variant uppercase">Student Aspirations & Career Goals</label>
<textarea class="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:border-primary focus:ring-0 transition-all font-body-md custom-scrollbar" placeholder="Describe the student's long-term career path and interests..." rows="4">The candidate expresses deep interest in Agritech and Rural Development. Looking for specialized training in high-yield cultivation techniques and supply chain management within the Sal Forest regions.</textarea>
</div>
<div class="grid grid-cols-2 gap-4">
<div class="space-y-1">
<label class="font-label-md text-label-md text-on-surface-variant uppercase">Center Allocation</label>
<select class="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:border-primary focus:ring-0 transition-all font-body-md appearance-none">
<option>Raipur Institutional Center</option>
<option>Bilaspur Hub</option>
<option>Jagdalpur Specialized Center</option>
</select>
</div>
<div class="space-y-1">
<label class="font-label-md text-label-md text-on-surface-variant uppercase">Stream Recommendation</label>
<select class="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:border-primary focus:ring-0 transition-all font-body-md appearance-none">
<option>Advanced Agricultural Tech</option>
<option>Renewable Energy Systems</option>
<option>Sustainable Textiles</option>
</select>
</div>
</div>
<div class="pt-4 flex gap-4">
<button class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all" type="button">Submit & Archive</button>
<button class="border border-secondary text-secondary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-secondary-container/10 transition-all" type="button">Save Draft</button>
</div>
</form>
</section>
<!-- Profile List (Upcoming) -->
<section class="animate-fade-up" style="animation-delay: 0.2s">
<div class="flex justify-between items-center mb-4">
<h3 class="font-title-lg text-title-lg text-on-surface">Queue for Tomorrow</h3>
<button class="text-primary font-label-md text-label-md hover:underline">View All Students</button>
</div>
<div class="space-y-3">
<!-- Student Row 1 -->
<div class="group flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
<img class="w-full h-full object-cover" data-alt="Close up of a young student with a hopeful expression, wearing a simple button-down shirt. The background is a blurred university hallway. The photo is taken with soft, natural lighting in a clean, modern aesthetic with hints of forest green and warm ivory." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfebPihFusPjgyqPJ3-Yy_OK4g6NQ_bqAUBjMEBgD9AnpGGlTOqiwgH5t1BGvzJbjzZPLXVgqcHr6ZLyKzEJFoKSrui3ylpTp4BBlcXzTjkXw-NwOoZANKtvpnJi8ueVBKLd6VpGAQL2z9Z0VrHpqtSdMFhTR1RYpRPwDC1fucTVChLY3ePdzrikNEH7H-yyZFKlB3ygqu7St2A6X58N3od3RBzlCmV3XhmoYwIOc3-zpZ5h2MRkU0"/>
</div>
<div class="flex-1">
<h4 class="font-title-lg text-body-lg font-bold text-on-surface">Ananya Verma</h4>
<p class="text-caption font-caption text-on-surface-variant">Batch 2024-B • Pre-Placement Review</p>
</div>
<div class="text-right">
<span class="block font-label-md text-label-md text-primary">09:30 AM</span>
<span class="text-[10px] uppercase tracking-widest text-on-surface-variant">Room 402</span>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
</div>
<!-- Student Row 2 -->
<div class="group flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
<img class="w-full h-full object-cover" data-alt="Portrait of a male student in his early 20s, smiling confidently. He is standing against a textured stone wall, representing the 'Museum Quality' aesthetic. Professional lighting with a soft amber glow, reflecting the SJKVY secondary color palette." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB09AweNCOa7tl2qd2zr7P6yqEUpAoVAgjOKL66N4lsxLm5A3NF-ITT5_wYT8kmptNr7c0DNnOciOl20dYUdc_p8QDfh9S7_ehXImN-h7PNyqp1QT19UbgU3Wv92lNWVYadwXJc3p_KKQKFRnGNOQpekdrUs_XcAQYdIHTqzeSSM_CxNzpHuteEjFWiPHivRR4ybQd44fCFNF5ZC_6zJAMXQDKoJzmUB0aP1RXRAoBQc6j9_AMmHvK"/>
</div>
<div class="flex-1">
<h4 class="font-title-lg text-body-lg font-bold text-on-surface">Rahul Deshmukh</h4>
<p class="text-caption font-caption text-on-surface-variant">Batch 2024-A • Final Selection</p>
</div>
<div class="text-right">
<span class="block font-label-md text-label-md text-primary">11:15 AM</span>
<span class="text-[10px] uppercase tracking-widest text-on-surface-variant">Virtual Hub</span>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
</div>
</div>
</section>
</div>
<!-- Right Column: Calendar View -->
<div class="col-span-12 lg:col-span-5 space-y-gutter">
<!-- Calendar Widget -->
<section class="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden animate-fade-up" style="animation-delay: 0.3s">
<div class="p-6 bg-primary-container/10 flex justify-between items-center border-b border-outline-variant/20">
<div>
<h3 class="font-title-lg text-title-lg text-on-surface">October 2024</h3>
<p class="text-caption font-caption text-on-primary-fixed-variant uppercase tracking-tighter">14 appointments scheduled</p>
</div>
<div class="flex gap-2">
<button class="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-white transition-colors">
<span class="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<button class="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-white transition-colors">
<span class="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
<div class="p-6">
<div class="grid grid-cols-7 text-center mb-4">
<span class="font-label-md text-[11px] text-on-surface-variant">MON</span>
<span class="font-label-md text-[11px] text-on-surface-variant">TUE</span>
<span class="font-label-md text-[11px] text-on-surface-variant">WED</span>
<span class="font-label-md text-[11px] text-on-surface-variant">THU</span>
<span class="font-label-md text-[11px] text-on-surface-variant">FRI</span>
<span class="font-label-md text-[11px] text-on-surface-variant">SAT</span>
<span class="font-label-md text-[11px] text-on-surface-variant text-error/60">SUN</span>
</div>
<div class="grid grid-cols-7 gap-2">
<!-- Calendar Days (Abbreviated for brevity) -->
<div class="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant">1</div>
<div class="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant">2</div>
<div class="h-12 flex flex-col items-center justify-center rounded-lg bg-primary-container text-white font-bold relative group">
                                    3
                                    <div class="absolute bottom-1 w-1 h-1 bg-white rounded-full"></div>
</div>
<div class="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant">4</div>
<div class="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant">5</div>
<div class="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant">6</div>
<div class="h-12 flex flex-col items-center justify-center rounded-lg text-on-surface-variant/40">7</div>
<!-- Adding current day highlighting logic -->
<div class="h-12 flex flex-col items-center justify-center rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant font-bold border-2 border-secondary">24</div>
<!-- ... other days ... -->
<div class="col-span-7 mt-6 p-4 bg-surface-container-low rounded-lg border-l-4 border-secondary">
<div class="flex items-center gap-2 mb-2">
<span class="material-symbols-outlined text-secondary text-[18px]">event_note</span>
<span class="font-label-md text-label-md text-on-secondary-container">Today's Highlight</span>
</div>
<p class="text-body-md text-on-surface-variant">3 sessions scheduled between 09:00 - 14:00. No urgent escalations noted.</p>
</div>
</div>
</div>
</section>
<!-- Stats Card -->
<section class="bg-on-background p-8 rounded-xl text-surface relative overflow-hidden animate-fade-up" style="animation-delay: 0.4s">
<div class="relative z-10">
<h3 class="font-title-lg text-title-lg mb-6">Counselling Impact</h3>
<div class="space-y-6">
<div>
<div class="flex justify-between text-caption mb-1 uppercase tracking-widest opacity-60">Success Rate</div>
<div class="h-1 bg-white/10 rounded-full overflow-hidden">
<div class="h-full bg-primary-fixed w-[88%]"></div>
</div>
<p class="text-display-md text-[32px] mt-2">88% <span class="text-body-md font-normal opacity-60">Center Allocation Efficiency</span></p>
</div>
<div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
<div>
<p class="text-caption opacity-60 uppercase">This Month</p>
<p class="text-title-lg">142</p>
</div>
<div>
<p class="text-caption opacity-60 uppercase">Avg. Time</p>
<p class="text-title-lg">45m</p>
</div>
</div>
</div>
</div>
<!-- Abstract background element -->
<div class="absolute -right-12 -bottom-12 w-48 h-48 bg-primary-fixed-variant opacity-10 rounded-full blur-3xl"></div>
</section>
</div>
</div>
</div>
</main>
<!-- FAB for quick notes -->
<button class="fixed bottom-10 right-10 w-14 h-14 bg-secondary text-surface rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
<span class="material-symbols-outlined">edit_note</span>
</button>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .glass-panel {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c9bf;
            border-radius: 10px;
        }
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
            animation: fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
