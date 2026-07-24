// GENERATED from handoff app/admin-hostel.html — do not edit by hand. Regenerate: npm run convert
export const portal = "admin";
export const title = "SJKVY Portal - Hostel & Residential Oversight";
export const html = `<!-- SideNavBar (Authority: JSON) -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-xl flex flex-col py-8 z-50 transition-transform duration-300 md:translate-x-0 -translate-x-full" id="sidebar">
<div class="px-6 mb-10">
<h1 class="font-display-md text-secondary-fixed tracking-tight leading-none mb-1">SJKVY Portal</h1>
<p class="font-label-sm text-on-primary/70 uppercase tracking-widest text-[10px]">Centre Admin</p>
</div>
<nav class="flex-1 space-y-1">
<!-- Dashboard -->
<a class="flex items-center px-6 py-3 space-x-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors group" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
<a class="flex items-center px-6 py-3 space-x-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors group" href="#">
<span class="material-symbols-outlined">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
<a class="flex items-center px-6 py-3 space-x-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors group" href="#">
<span class="material-symbols-outlined">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
<a class="flex items-center px-6 py-3 space-x-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors group" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-label-md">Directory</span>
</a>
<!-- Active Tab: Hostel Tracking -->
<a class="flex items-center px-6 py-3 space-x-3 bg-white/10 text-secondary-fixed font-bold border-l-4 border-secondary-fixed" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
<a class="flex items-center px-6 py-3 space-x-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors group" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md">Reports</span>
</a>
</nav>
<div class="px-6 mt-auto">
<button class="w-full bg-secondary-container text-on-secondary-fixed font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform">
<span class="material-symbols-outlined text-[20px]">add</span>
<span class="font-label-md">Quick Enroll</span>
</button>
<div class="mt-8 space-y-1 border-t border-white/10 pt-4">
<a class="flex items-center py-2 space-x-3 text-on-primary/60 hover:text-on-primary transition-colors" href="#">
<span class="material-symbols-outlined text-[20px]">settings</span>
<span class="font-label-md">Settings</span>
</a>
<a class="flex items-center py-2 space-x-3 text-on-primary/60 hover:text-on-primary transition-colors" href="#">
<span class="material-symbols-outlined text-[20px]">help</span>
<span class="font-label-md">Support</span>
</a>
</div>
</div>
</aside>
<!-- TopAppBar (Authority: JSON) -->
<header class="flex justify-between items-center ml-72 px-gutter h-20 bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant">
<div class="flex items-center space-x-8">
<div class="relative">
<span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
<input class="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full w-64 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="Search rooms or residents..." type="text"/>
</div>
<h2 class="font-headline-lg text-primary">Hostel & Residential</h2>
</div>
<div class="flex items-center space-x-6">
<button class="text-on-surface-variant hover:text-primary transition-colors relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="flex items-center space-x-3 pl-4 border-l border-outline-variant">
<div class="text-right">
<p class="font-label-md text-on-surface leading-none">Admin User</p>
<p class="text-[10px] text-outline uppercase tracking-tighter">Warden Office</p>
</div>
<img class="w-10 h-10 rounded-full object-cover museum-shadow border border-outline-variant" data-alt="A high-end, professional headshot of a middle-aged woman with a confident expression, wearing a tailored charcoal blazer. She is set against a soft-focus architectural background of a modern academic building, with warm ivory lighting and a sophisticated, museum-quality photographic finish." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9PrxQZG5cm6T1f55pwIh6xap8sgKNwpS031aNmLrs84gGF8V_lIQEmpq6HvsI6BuenyESjmDjbl43SEmR48xoM3pLUZrtpTW9WIoeoU4XhMHWRfrbtOJqVS-CE_oUIxC_I2JLHjE1dx30XRPnRjYooIPbQwSMUp7QwEwHFDernveFhnR18nIauDWJzUYwUDEZOAoYDm7zSDQF4Uj6NSUgHiRlib-3CahjxNn18G37cuMxH-ZOe2Vf"/>
</div>
</div>
</header>
<!-- Main Content -->
<main class="ml-72 p-gutter min-h-screen">
<div class="max-w-max-width mx-auto">
<!-- Header Section -->
<section class="mb-10 stagger-in">
<h3 class="font-display-md text-on-background mb-2">Campus Overview</h3>
<p class="text-on-surface-variant max-w-2xl font-body-lg">Real-time tracking of residential logistics, occupancy metrics, and facility health for the North and East Wings.</p>
</section>
<!-- Grid Layout -->
<div class="grid grid-cols-12 gap-6 stagger-in">
<!-- Main Content Column: Architectural Occupancy Map -->
<div class="col-span-12 lg:col-span-8 space-y-6">
<div class="bg-white rounded-xl museum-shadow border border-outline-variant/20 overflow-hidden">
<div class="p-6 border-b border-outline-variant/10 flex justify-between items-center">
<div>
<h4 class="font-title-lg text-primary">North Wing Occupancy</h4>
<p class="font-label-md text-outline">Level 3: Floor Plan (Live View)</p>
</div>
<div class="flex space-x-2">
<span class="flex items-center space-x-1"><span class="w-3 h-3 rounded-sm bg-primary"></span> <span class="text-[10px] font-label-md">Occupied</span></span>
<span class="flex items-center space-x-1"><span class="w-3 h-3 rounded-sm bg-secondary-container"></span> <span class="text-[10px] font-label-md">Pending</span></span>
<span class="flex items-center space-x-1"><span class="w-3 h-3 rounded-sm bg-surface-container-high border border-outline-variant"></span> <span class="text-[10px] font-label-md">Vacant</span></span>
</div>
</div>
<div class="p-8 bg-surface-container-lowest flex items-center justify-center relative min-h-[400px]">
<!-- Architectural Diagram Mock -->
<div class="grid grid-cols-6 grid-rows-3 gap-2 w-full max-w-2xl transform hover:scale-[1.02] transition-transform duration-500">
<!-- Row 1 -->
<div class="h-32 bg-primary rounded-sm flex items-end p-2 group cursor-pointer hover:ring-2 ring-primary ring-offset-2 transition-all">
<span class="text-[10px] text-on-primary font-bold">301</span>
</div>
<div class="h-32 bg-primary rounded-sm flex items-end p-2 opacity-90">
<span class="text-[10px] text-on-primary font-bold">302</span>
</div>
<div class="h-32 bg-surface-container-high border border-outline-variant flex items-end p-2">
<span class="text-[10px] text-outline font-bold">303</span>
</div>
<div class="h-32 col-span-2 bg-primary/80 rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-primary font-bold">304-305 (Dorm)</span>
</div>
<div class="h-32 bg-primary rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-primary font-bold">306</span>
</div>
<!-- Corridor Row -->
<div class="col-span-6 h-8 bg-surface-container flex items-center px-4">
<span class="text-[9px] font-label-md text-outline uppercase tracking-widest">Main Corridor - Level 3</span>
</div>
<!-- Row 2 -->
<div class="h-32 bg-primary rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-primary font-bold">307</span>
</div>
<div class="h-32 bg-secondary-container rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-secondary-container font-bold">308</span>
</div>
<div class="h-32 bg-primary rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-primary font-bold">309</span>
</div>
<div class="h-32 bg-primary rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-primary font-bold">310</span>
</div>
<div class="h-32 bg-surface-container-high border border-outline-variant flex items-end p-2">
<span class="text-[10px] text-outline font-bold">311</span>
</div>
<div class="h-32 bg-primary rounded-sm flex items-end p-2">
<span class="text-[10px] text-on-primary font-bold">312</span>
</div>
</div>
<!-- Atmospheric Overlay -->
<div class="absolute bottom-4 right-4 bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-outline-variant/30 text-[11px]">
<p class="font-bold text-primary">Occupancy Rate: 82%</p>
<p class="text-outline">4 rooms available in this wing</p>
</div>
</div>
</div>
<!-- Maintenance Queue -->
<div class="bg-white rounded-xl museum-shadow border border-outline-variant/20 p-6">
<div class="flex justify-between items-center mb-6">
<h4 class="font-title-lg text-on-background">Maintenance Requests</h4>
<button class="text-primary font-label-md flex items-center hover:underline">
                                View History <span class="material-symbols-outlined text-[18px] ml-1">arrow_forward</span>
</button>
</div>
<div class="space-y-4">
<!-- Urgent -->
<div class="flex items-center p-4 border-l-4 border-error bg-error-container/20 rounded-r-lg group hover:bg-error-container/30 transition-colors">
<span class="material-symbols-outlined text-error mr-4">water_damage</span>
<div class="flex-1">
<p class="font-body-md font-bold text-on-background">Burst Pipe - Floor 2, Room 214</p>
<p class="text-caption text-on-surface-variant">Reported 12 mins ago • Resident: Rohan Sharma</p>
</div>
<span class="px-3 py-1 bg-error/10 text-error text-[10px] font-bold rounded-full uppercase">Urgent</span>
</div>
<!-- Medium -->
<div class="flex items-center p-4 border-l-4 border-secondary bg-secondary-container/10 rounded-r-lg group hover:bg-secondary-container/20 transition-colors">
<span class="material-symbols-outlined text-secondary mr-4">lightbulb</span>
<div class="flex-1">
<p class="font-body-md font-bold text-on-background">Light Flicker - Common Hall B</p>
<p class="text-caption text-on-surface-variant">Reported 2 hours ago • Facility Staff</p>
</div>
<span class="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full uppercase">Medium</span>
</div>
<!-- Low -->
<div class="flex items-center p-4 border-l-4 border-outline bg-surface-container-low rounded-r-lg group transition-colors">
<span class="material-symbols-outlined text-outline mr-4">door_sensor</span>
<div class="flex-1">
<p class="font-body-md font-bold text-on-background">Loose Door Handle - Room 402</p>
<p class="text-caption text-on-surface-variant">Reported 4 hours ago • Resident: Aisha K.</p>
</div>
<span class="px-3 py-1 bg-outline/10 text-outline text-[10px] font-bold rounded-full uppercase">Low</span>
</div>
</div>
</div>
</div>
<!-- Sidebar Column: Status & Widgets -->
<div class="col-span-12 lg:col-span-4 space-y-6">
<!-- Dining Hall Widget -->
<div class="bg-primary text-on-primary rounded-xl museum-shadow overflow-hidden relative">
<div class="p-6 relative z-10">
<div class="flex items-center justify-between mb-8">
<div class="flex items-center space-x-2">
<span class="material-symbols-outlined">restaurant</span>
<h4 class="font-title-lg">Dining Hall</h4>
</div>
<span class="bg-on-primary/20 px-2 py-1 rounded text-[10px] font-bold uppercase">Status: Active</span>
</div>
<div class="space-y-4">
<div class="flex justify-between items-end">
<span class="text-body-md opacity-80">Current Crowd</span>
<span class="font-display-md leading-none">64%</span>
</div>
<div class="w-full bg-white/20 h-2 rounded-full overflow-hidden">
<div class="bg-secondary-fixed h-full w-[64%]"></div>
</div>
<div class="pt-2 border-t border-white/10">
<p class="text-caption italic opacity-70">"Lunch Service ends in 45 minutes. Expect higher density at counters 2 and 4."</p>
</div>
</div>
</div>
<!-- Subtle Background Graphic -->
<div class="absolute -bottom-6 -right-6 opacity-10">
<span class="material-symbols-outlined text-[120px]" style="font-variation-settings: 'FILL' 1;">restaurant_menu</span>
</div>
</div>
<!-- Occupancy Heatmap Floor Overview -->
<div class="bg-white rounded-xl museum-shadow border border-outline-variant/20 p-6">
<h4 class="font-title-lg text-on-background mb-4">Floor Summary</h4>
<div class="space-y-4">
<div class="flex items-center justify-between">
<span class="font-label-md text-on-surface-variant">Floor 4 (Premium)</span>
<div class="flex items-center space-x-2">
<span class="font-bold text-primary">100%</span>
<span class="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden"><div class="bg-primary h-full w-full"></div></span>
</div>
</div>
<div class="flex items-center justify-between">
<span class="font-label-md text-on-surface-variant">Floor 3 (Standard)</span>
<div class="flex items-center space-x-2">
<span class="font-bold text-primary">82%</span>
<span class="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden"><div class="bg-primary h-full w-[82%]"></div></span>
</div>
</div>
<div class="flex items-center justify-between">
<span class="font-label-md text-on-surface-variant">Floor 2 (Dormitory)</span>
<div class="flex items-center space-x-2">
<span class="font-bold text-primary">95%</span>
<span class="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden"><div class="bg-primary h-full w-[95%]"></div></span>
</div>
</div>
<div class="flex items-center justify-between">
<span class="font-label-md text-on-surface-variant">Floor 1 (Accessible)</span>
<div class="flex items-center space-x-2">
<span class="font-bold text-primary">45%</span>
<span class="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden"><div class="bg-primary h-full w-[45%]"></div></span>
</div>
</div>
</div>
</div>
<!-- Quick Actions -->
<div class="grid grid-cols-2 gap-4">
<button class="bg-white p-4 rounded-xl museum-shadow border border-outline-variant/20 flex flex-col items-center text-center group hover:border-primary transition-all">
<div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">person_add</span>
</div>
<span class="text-[11px] font-bold text-on-surface uppercase tracking-tighter">Assign Room</span>
</button>
<button class="bg-white p-4 rounded-xl museum-shadow border border-outline-variant/20 flex flex-col items-center text-center group hover:border-primary transition-all">
<div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">description</span>
</div>
<span class="text-[11px] font-bold text-on-surface uppercase tracking-tighter">Daily Log</span>
</button>
<button class="bg-white p-4 rounded-xl museum-shadow border border-outline-variant/20 flex flex-col items-center text-center group hover:border-primary transition-all">
<div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">inventory_2</span>
</div>
<span class="text-[11px] font-bold text-on-surface uppercase tracking-tighter">Inventory</span>
</button>
<button class="bg-white p-4 rounded-xl museum-shadow border border-outline-variant/20 flex flex-col items-center text-center group hover:border-primary transition-all">
<div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">campaign</span>
</div>
<span class="text-[11px] font-bold text-on-surface uppercase tracking-tighter">Notice</span>
</button>
</div>
<!-- Recent Activity Card -->
<div class="bg-surface-container-low rounded-xl border border-outline-variant/30 p-6">
<h4 class="font-label-md text-outline uppercase tracking-widest mb-4">Live Activity</h4>
<ul class="space-y-4">
<li class="flex items-start space-x-3">
<div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
<p class="text-caption text-on-surface-variant"><span class="font-bold text-on-background">Check-in:</span> Priya Verma, Room 301. <span class="opacity-60 block">10 mins ago</span></p>
</li>
<li class="flex items-start space-x-3">
<div class="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5"></div>
<p class="text-caption text-on-surface-variant"><span class="font-bold text-on-background">Guest Entry:</span> Visitor log #4421 verified. <span class="opacity-60 block">25 mins ago</span></p>
</li>
<li class="flex items-start space-x-3">
<div class="w-1.5 h-1.5 rounded-full bg-outline mt-1.5"></div>
<p class="text-caption text-on-surface-variant"><span class="font-bold text-on-background">System:</span> HVAC Weekly report generated. <span class="opacity-60 block">1 hour ago</span></p>
</li>
</ul>
</div>
</div>
</div>
</div>
</main>
<!-- Floating Micro Interaction: Interactive Map Hover Effect script -->`;
export const css = `.material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .active-nav-indicator {
        box-shadow: inset 4px 0 0 0 #ffdea5;
      }
      .museum-shadow {
        box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
      }
      .backdrop-blur-matte {
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #c1c9bf; border-radius: 10px; }
      
      .stagger-in > * {
        opacity: 0;
        transform: translateY(10px);
        animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      @keyframes slideUp {
        to { opacity: 1; transform: translateY(0); }
      }
      .stagger-in > *:nth-child(1) { animation-delay: 0.1s; }
      .stagger-in > *:nth-child(2) { animation-delay: 0.2s; }
      .stagger-in > *:nth-child(3) { animation-delay: 0.3s; }
      .stagger-in > *:nth-child(4) { animation-delay: 0.4s; }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
