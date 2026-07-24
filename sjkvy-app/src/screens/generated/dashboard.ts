// GENERATED from handoff app/dashboard.html — do not edit by hand. Regenerate: npm run convert
export const portal = "applicant";
export const title = "SJKVY | Applicant Dashboard";
export const html = `<!-- SideNavBar (Shared Component) -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-tertiary dark:bg-inverse-surface flex flex-col py-8 gap-base shadow-xl border-r border-outline/10 z-[60] hidden md:flex">
<div class="px-6 mb-12">
<h1 class="font-display-md text-display-md text-surface dark:text-on-surface leading-tight">Saksham Jharkhand</h1>
<p class="font-label-md text-label-md text-tertiary-fixed-dim uppercase tracking-widest mt-1">Institutional Portal</p>
</div>
<nav class="flex-1 flex flex-col gap-2">
<!-- Dashboard Active -->
<a class="flex items-center gap-4 text-on-secondary bg-transparent border-l-4 border-secondary-fixed pl-4 font-bold h-12 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-label-md text-label-md">Dashboard</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim pl-4 font-normal h-12 hover:bg-tertiary-container/20 hover:text-on-tertiary-container transition-all" href="#">
<span class="material-symbols-outlined" data-icon="edit_note">edit_note</span>
<span class="font-label-md text-label-md">Application</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim pl-4 font-normal h-12 hover:bg-tertiary-container/20 hover:text-on-tertiary-container transition-all" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span class="font-label-md text-label-md">Documents</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim pl-4 font-normal h-12 hover:bg-tertiary-container/20 hover:text-on-tertiary-container transition-all" href="#">
<span class="material-symbols-outlined" data-icon="hourglass_empty">hourglass_empty</span>
<span class="font-label-md text-label-md">Timeline</span>
</a>
</nav>
<div class="px-6 mt-auto flex flex-col gap-4">
<button class="w-full py-3 bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-2 hover:brightness-110 transition-all">
<span class="material-symbols-outlined" data-icon="add">add</span>
                New Application
            </button>
<div class="pt-6 border-t border-outline/20">
<a class="flex items-center gap-4 text-tertiary-fixed-dim mb-4 hover:text-on-tertiary-container" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim hover:text-on-tertiary-container" href="#">
<span class="material-symbols-outlined" data-icon="contact_support">contact_support</span>
<span class="font-label-md text-label-md">Support</span>
</a>
</div>
</div>
</aside>
<!-- TopNavBar (Shared Component) -->
<header class="fixed top-0 w-full z-50 h-[72px] flex items-center justify-between px-margin-desktop w-full max-w-max-width mx-auto bg-surface/60 backdrop-blur-md dark:bg-surface-dim/60 shadow-sm border-b border-secondary/20 dark:border-secondary-fixed/10 md:pl-[328px]">
<div class="flex items-center gap-8">
<div class="font-display-md text-display-md text-primary dark:text-primary-fixed-dim">SJKVY Portal</div>
<nav class="hidden lg:flex items-center gap-6">
<a class="font-body-md text-body-md text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="#">Directory</a>
<a class="font-body-md text-body-md text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="#">Resources</a>
</nav>
</div>
<div class="flex items-center gap-6">
<div class="relative hidden sm:block">
<input class="bg-surface-container-low border-none focus:ring-1 focus:ring-primary h-10 px-4 w-64 text-body-md" placeholder="Search resources..." type="text"/>
<span class="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant" data-icon="search">search</span>
</div>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined cursor-pointer text-primary" data-icon="notifications">notifications</span>
<span class="material-symbols-outlined cursor-pointer text-primary" data-icon="help_outline">help_outline</span>
<div class="w-10 h-10 bg-secondary-fixed flex items-center justify-center overflow-hidden border border-secondary/20">
<img class="w-full h-full object-cover" data-alt="Close-up portrait of a professional institutional administrator with a warm and approachable expression, set against a blurred academic background. The lighting is soft and natural, emphasizing a clean and authoritative light-mode aesthetic consistent with the portal's ivory and green palette." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWPZtKZbn7EZ8MTpcpyRIf5hUCpapM_5rXgJd-ucGK42Sy7q7IXVDS0vLQRhS9SZaAbPmDOE_VpRFrek5RSkhav5RcWLJTG0B2plyTzuq56IIZ33GUPr3ZYV9GyoVTmoU179LPMXC0Y9u1b_fXAUeuBvofLXXH7gpRE6thppOr36OkSkxYN-KD9J1XbO7Ae_8oAMfSBMJ4Iu4hxU5znb94QbBBDoH7NbhBLJxxdx3zjw8QmF7M6e-o"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="pt-[72px] md:pl-[280px] min-h-screen">
<div class="max-w-[1200px] mx-auto px-margin-mobile md:px-gutter py-12">
<!-- Museum Quality Welcome Card -->
<section class="animate-fade-up">
<div class="relative w-full h-64 overflow-hidden mb-12 flex items-end p-10 border border-secondary/20 museum-shadow">
<div class="absolute inset-0 bg-cover bg-center -z-10 brightness-[0.85]" data-alt="A serene landscape of rolling hills in Jharkhand, India, captured during the golden hour with soft rays of light piercing through the mist. The visual style is artistic and archival, with a focus on natural textures and muted tones of forest green and warm ivory to evoke a sense of heritage and quiet authority." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCeLQ6K54lmXOalUhMVjxjGWT1E6q_9UaPlFj7ouzSRdnIIO4hRAe9U9TYDdRp9E4AMFeXDW2AHsaecLmhyjqjpWdwIxPeeezgGZ5QSePvIAtQwNRHCC3W2oixbPxmzHC3AqfwYMpcFkagJko8z6jBPM0SQ9ZwIi2Xo9luqAfplnoofblGRF7Mb-R6sDlkoF4zcVIoJZfMgXeQT0wAw8ZoFQN71qakKNPmfJzFSyybdH2voDrbFg-YH')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent -z-10"></div>
<div class="flex flex-col gap-2">
<span class="font-label-md text-label-md text-secondary-fixed uppercase tracking-[0.2em]">Applicant Overview</span>
<h2 class="font-display-lg text-display-lg text-white">Welcome, Arjun Mahato</h2>
<div class="flex items-center gap-3 mt-2">
<span class="px-3 py-1 bg-primary text-on-primary font-label-md text-label-md">Status: In Review</span>
<span class="text-white/80 font-body-md text-body-md">Application ID: #SJKVY-2024-00892</span>
</div>
</div>
</div>
</section>
<!-- KPI Cards Grid -->
<section class="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-12">
<!-- Application Progress -->
<div class="bg-surface-container-lowest p-8 border-t-2 border-primary museum-shadow animate-fade-up stagger-1">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Application Progress</span>
<span class="material-symbols-outlined text-primary" data-icon="analytics">analytics</span>
</div>
<div class="flex items-baseline gap-2 mb-4">
<span class="font-display-md text-display-md text-on-surface">75%</span>
<span class="font-body-md text-body-md text-on-surface-variant">Complete</span>
</div>
<div class="w-full h-1.5 bg-surface-container-highest">
<div class="h-full bg-primary" style="width: 75%"></div>
</div>
</div>
<!-- Next Action -->
<div class="bg-surface-container-lowest p-8 border-t-2 border-secondary museum-shadow animate-fade-up stagger-2">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Next Action</span>
<span class="material-symbols-outlined text-secondary" data-icon="priority_high">priority_high</span>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface mb-2">Upload TC</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-4">Transfer Certificate required for final verification.</p>
<a class="text-primary font-label-md text-label-md uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all" href="#">
                        Complete Action <span class="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
</a>
</div>
<!-- Verification Status -->
<div class="bg-surface-container-lowest p-8 border-t-2 border-tertiary-container museum-shadow animate-fade-up stagger-3">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Verification Status</span>
<span class="material-symbols-outlined text-tertiary-container" data-icon="verified_user">verified_user</span>
</div>
<div class="flex flex-col gap-4">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary text-[20px]" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-body-md text-body-md text-on-surface">ID Proof Verified</span>
</div>
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary text-[20px]" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-body-md text-body-md text-on-surface">Income Certificate Valid</span>
</div>
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-on-surface-variant/30 text-[20px]" data-icon="radio_button_unchecked">radio_button_unchecked</span>
<span class="font-body-md text-body-md text-on-surface-variant">Academic Review Pending</span>
</div>
</div>
</div>
</section>
<!-- Quick Links Grid -->
<section class="animate-fade-up stagger-3">
<h3 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.25em] mb-6 pl-1">Quick Links</h3>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Continue Application -->
<button class="group relative bg-surface-container overflow-hidden p-10 flex flex-col items-center text-center transition-all hover:bg-surface-container-high border border-secondary/10">
<div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
<span class="material-symbols-outlined text-primary text-3xl" data-icon="edit_square">edit_square</span>
</div>
<h4 class="font-title-lg text-title-lg text-on-surface mb-2">Continue Application</h4>
<p class="font-body-md text-body-md text-on-surface-variant">Resume your application from where you left off.</p>
</button>
<!-- Upload Documents -->
<button class="group relative bg-surface-container overflow-hidden p-10 flex flex-col items-center text-center transition-all hover:bg-surface-container-high border border-secondary/10">
<div class="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
<span class="material-symbols-outlined text-secondary text-3xl" data-icon="upload_file">upload_file</span>
</div>
<h4 class="font-title-lg text-title-lg text-on-surface mb-2">Upload Documents</h4>
<p class="font-body-md text-body-md text-on-surface-variant">Manage and submit your supporting documentation.</p>
</button>
<!-- View Timeline -->
<button class="group relative bg-surface-container overflow-hidden p-10 flex flex-col items-center text-center transition-all hover:bg-surface-container-high border border-secondary/10">
<div class="w-16 h-16 bg-tertiary/10 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
<span class="material-symbols-outlined text-tertiary text-3xl" data-icon="view_timeline">view_timeline</span>
</div>
<h4 class="font-title-lg text-title-lg text-on-surface mb-2">View Timeline</h4>
<p class="font-body-md text-body-md text-on-surface-variant">Track milestones and expected completion dates.</p>
</button>
</div>
</section>
<!-- Bottom Separator -->
<div class="mt-24 h-px bronze-divider w-full"></div>
<footer class="mt-8 flex flex-col md:flex-row justify-between items-center text-on-surface-variant font-caption text-caption gap-4">
<p>© 2024 Saksham Jharkhand Skill Vikas Yojana. All Rights Reserved.</p>
<div class="flex gap-6">
<a class="hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a class="hover:text-primary transition-colors" href="#">Contact Administrator</a>
</div>
</footer>
</div>
</main>
<!-- Mobile Bottom Navigation (Shared Component) -->
<nav class="fixed bottom-0 left-0 w-full bg-surface glass-nav border-t border-outline/10 flex md:hidden h-16 z-50 px-4">
<div class="flex-1 flex flex-col items-center justify-center text-primary border-t-2 border-primary">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-label-md text-[10px]">Home</span>
</div>
<div class="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined" data-icon="edit_note">edit_note</span>
<span class="font-label-md text-[10px]">App</span>
</div>
<div class="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span class="font-label-md text-[10px]">Docs</span>
</div>
<div class="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-label-md text-[10px]">Menu</span>
</div>
</nav>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .bronze-divider {
            background-color: #775a19;
            opacity: 0.1;
        }
        .glass-nav {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
            animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
