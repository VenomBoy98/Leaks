// GENERATED from handoff app/staff-directory.html — do not edit by hand. Regenerate: npm run convert
export const portal = "staff";
export const title = "SJKVY Portal | Staff & Instructor Management";
export const html = `<!-- Sidebar Navigation -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-xl flex flex-col py-8 z-50">
<div class="px-6 mb-10">
<h1 class="font-display-md text-secondary-fixed tracking-tight leading-none">SJKVY Portal</h1>
<p class="text-on-primary/60 text-caption mt-1 font-label-md">Centre Admin</p>
</div>
<nav class="flex-1 space-y-1 custom-scrollbar overflow-y-auto px-2">
<!-- Navigation Items mapped from JSON -->
<a class="flex items-center px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg group" href="#">
<span class="material-symbols-outlined mr-3">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
<a class="flex items-center px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg group" href="#">
<span class="material-symbols-outlined mr-3">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
<a class="flex items-center px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg group" href="#">
<span class="material-symbols-outlined mr-3">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
<a class="flex items-center px-4 py-3 bg-white/10 text-secondary-fixed font-bold border-l-4 border-secondary-fixed rounded-r-lg group" href="#">
<span class="material-symbols-outlined mr-3">group</span>
<span class="font-label-md">Directory</span>
</a>
<a class="flex items-center px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg group" href="#">
<span class="material-symbols-outlined mr-3">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
<a class="flex items-center px-4 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg group" href="#">
<span class="material-symbols-outlined mr-3">assessment</span>
<span class="font-label-md">Reports</span>
</a>
</nav>
<div class="px-6 mt-6 space-y-4">
<button class="w-full bg-secondary-fixed text-on-secondary-fixed py-3 rounded-lg font-bold flex items-center justify-center gap-2 scale-98 active:scale-95 transition-transform" onclick="toggleModal('onboardingModal')">
<span class="material-symbols-outlined">person_add</span>
                Quick Enroll
            </button>
<div class="pt-6 border-t border-white/10 space-y-1">
<a class="flex items-center px-4 py-2 text-on-primary/60 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined mr-3">settings</span>
<span class="font-label-md">Settings</span>
</a>
<a class="flex items-center px-4 py-2 text-on-primary/60 hover:text-on-primary hover:bg-white/5 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined mr-3">help</span>
<span class="font-label-md">Support</span>
</a>
</div>
</div>
</aside>
<!-- Main Content Area -->
<main class="ml-72 min-h-screen">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-gutter h-20 bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant">
<div class="flex items-center gap-6">
<h2 class="font-display-md text-primary font-semibold">Staff Directory</h2>
<div class="relative hidden lg:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="pl-10 pr-4 py-2 bg-surface-container border-none rounded-full w-80 text-body-md focus:ring-2 focus:ring-primary" placeholder="Search instructors, admins..." type="text"/>
</div>
</div>
<div class="flex items-center gap-4">
<button class="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="w-10 h-10 rounded-full overflow-hidden border border-outline-variant">
<img class="w-full h-full object-cover" data-alt="A professional studio headshot of a middle-aged female administrative director with a friendly expression. She is wearing a structured forest green blazer that matches the primary brand color, set against a warm ivory minimalist background. The lighting is soft and corporate, conveying authority and approachability." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8AazyaTglEy7qW6B9XLLilV3LnHtrWNMbjm2Jc5TCiWVGXOqzv-nqUcM430LUDFz-n0gqbtv1Fg3wGJ6zFoANkzTDC6Ioj3aAZODP_R4OmIsay6lQgJsgfJyeZqOfnauU-KwVTHDRRjblN0Fu0gUa38jbytBcXzgponfetpgUMzBzo8_24EoBtxCLrYkxAo9CahEdqH6OricIYLTxbNYjhyDzla6T-AA-5She787mfHcg2RLUQZIw"/>
</div>
</div>
</header>
<!-- Content Canvas -->
<section class="p-gutter max-w-max-width mx-auto">
<!-- Quick Stats Bento Grid -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
<div class="bento-card bg-surface-container-lowest p-6 rounded-xl museum-shadow border-t-2 border-primary">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-primary text-3xl">groups</span>
<span class="text-on-primary-fixed-variant bg-primary-fixed px-2 py-1 rounded text-caption font-bold">+4 New</span>
</div>
<p class="text-on-surface-variant font-label-md uppercase tracking-wider">Total Staff</p>
<h3 class="font-display-md text-on-surface">148</h3>
</div>
<div class="bento-card bg-surface-container-lowest p-6 rounded-xl museum-shadow border-t-2 border-secondary">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-secondary text-3xl">school</span>
<span class="text-on-secondary-fixed-variant bg-secondary-fixed px-2 py-1 rounded text-caption font-bold">82% Active</span>
</div>
<p class="text-on-surface-variant font-label-md uppercase tracking-wider">Instructors</p>
<h3 class="font-display-md text-on-surface">64</h3>
</div>
<div class="bento-card bg-surface-container-lowest p-6 rounded-xl museum-shadow border-t-2 border-tertiary">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-tertiary text-3xl">pending_actions</span>
<span class="text-error bg-error-container px-2 py-1 rounded text-caption font-bold">Urgent</span>
</div>
<p class="text-on-surface-variant font-label-md uppercase tracking-wider">Open Positions</p>
<h3 class="font-display-md text-on-surface">06</h3>
</div>
<div class="bento-card bg-primary text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
<div>
<h4 class="font-title-lg mb-2">Staff Training</h4>
<p class="text-white/80 text-body-md">Next workshop: Advanced Pedagogy</p>
</div>
<div class="flex items-center gap-2 mt-4 text-secondary-fixed">
<span class="font-label-md">Join Session</span>
<span class="material-symbols-outlined">arrow_forward</span>
</div>
</div>
</div>
<!-- Directory Section -->
<div class="bg-surface-container-lowest rounded-xl museum-shadow border border-outline-variant/20 overflow-hidden">
<div class="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
<div class="flex gap-2">
<button class="bg-primary text-white px-4 py-2 rounded-lg font-label-md">All Staff</button>
<button class="hover:bg-surface-container px-4 py-2 rounded-lg font-label-md transition-colors">Instructors</button>
<button class="hover:bg-surface-container px-4 py-2 rounded-lg font-label-md transition-colors">Counselors</button>
<button class="hover:bg-surface-container px-4 py-2 rounded-lg font-label-md transition-colors">Admin</button>
</div>
<div class="flex items-center gap-3">
<button class="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg font-label-md hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined text-sm">filter_list</span> Filter
                        </button>
<button class="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg font-label-md hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined text-sm">download</span> Export
                        </button>
</div>
</div>
<!-- Table -->
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead>
<tr class="bg-surface-container-low">
<th class="px-6 py-4 font-label-md text-primary uppercase tracking-widest">Name &amp; Role</th>
<th class="px-6 py-4 font-label-md text-primary uppercase tracking-widest">Department</th>
<th class="px-6 py-4 font-label-md text-primary uppercase tracking-widest">Availability</th>
<th class="px-6 py-4 font-label-md text-primary uppercase tracking-widest">Performance</th>
<th class="px-6 py-4 font-label-md text-primary uppercase tracking-widest">Assigned Batches</th>
<th class="px-6 py-4"></th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/10">
<!-- Staff Member 1 -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="px-6 py-5">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high">
<img class="w-full h-full object-cover" data-alt="Close-up portrait of a professional male instructor in his late 20s. He has a focused expression and wears modern glasses. The background is a clean, bright studio with subtle wooden textures that complement the museum-quality aesthetic of the portal." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl31qlb0RSfhMamv1bM_f2fOIh2hkXvFX7NgQabvRm7jOAY_bWbyDesFqPR-5wsoT-uC1gaqDOAItQWXYHH_t7-5bRtOZbHW_gqYE_7oChGJqHXraOWm4bU_2sb-6pTtni16KQAL8-sHvD3q0yE4C8KHKHVeuCSnvhD5kskdLaJ8aTnQiPRUJSX6Jch7VhKqj5wRPr7gn1yiapN1fNmdncs9v6pw70rtJAbsA1J6cMjrZWrIyDGMfy"/>
</div>
<div>
<p class="font-title-lg text-on-surface leading-none">Arjun Mehta</p>
<p class="text-caption text-on-surface-variant mt-1">Lead IT Trainer</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<span class="text-body-md font-medium text-tertiary">Skill Development</span>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="text-body-md">On Duty</span>
</div>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-1">
<span class="text-body-md font-bold">4.8</span>
<span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-caption text-on-surface-variant ml-1">(120 Reviews)</span>
</div>
</td>
<td class="px-6 py-5">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold border-2 border-surface">B1</div>
<div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold border-2 border-surface">B4</div>
<div class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center text-xs border-2 border-surface">+2</div>
</div>
</td>
<td class="px-6 py-5 text-right">
<button class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container rounded-lg">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Staff Member 2 -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="px-6 py-5">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high">
<img class="w-full h-full object-cover" data-alt="A portrait of a serene female counselor in her 40s. She is wearing a traditional yet modern silk scarf in deep gold tones. She is sitting in a brightly lit office with minimalist architectural lines and soft shadows. Her expression is empathetic and professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO32CDIYxwsXbexl75mo1OdSZ2TnbApWooHvGm5KQgCNXLFs-5ILf4qQbe6BywnYIfiPjb4yiS22Q5KhRqXG_M-n6AYJzxMrPT76H2TbQgdN6b50-XM_ad10Q-8a16lxaZOxffFw_EzcLBNp4em1qjnhFzBnv4HpnaDvR6j1nSvZ4wflaacmVQekVOEk_2TD4xXoLxKMfkodgTdmZupxZoMLYbW_Pm5vxRlbud6INaBTXMl2n2KmD6"/>
</div>
<div>
<p class="font-title-lg text-on-surface leading-none">Priya Sharma</p>
<p class="text-caption text-on-surface-variant mt-1">Senior Counselor</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<span class="text-body-md font-medium text-tertiary">Student Welfare</span>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-secondary"></span>
<span class="text-body-md">In Meeting</span>
</div>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-1">
<span class="text-body-md font-bold">4.9</span>
<span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-caption text-on-surface-variant ml-1">(85 Reviews)</span>
</div>
</td>
<td class="px-6 py-5">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold border-2 border-surface">C12</div>
</div>
</td>
<td class="px-6 py-5 text-right">
<button class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container rounded-lg">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Staff Member 3 -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="px-6 py-5">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high">
<img class="w-full h-full object-cover" data-alt="A photograph of a young male training assistant with short hair and a polo shirt. He is standing in a brightly lit hallway of a modern institutional building. The lighting is high-key and airy, giving a clean professional vibe. The background shows blurred architectural details of a modern campus." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPVaylaatPi1FvvuhyIfL_GcfTmuGGXP14bXO6eiBoHBtwIbqqxV5AyMqIf3LORfeg2DEa8C53V_jJJbRDA6XpIHHdAGQgjLkzPRU0kX1B2LkkndfMLtVLWLQ8FLdptkOGORefERbiSNjOL9mK0DxBePquuF9SxKviTfuz45mbr6gUEZLPoTg8b9nGsbZfJIl_WbhuDW5w6FcV-nrX2gbGUjcEo0jmO5Yn9c2a6LXVGU172xig36L4"/>
</div>
<div>
<p class="font-title-lg text-on-surface leading-none">Kabir Singh</p>
<p class="text-caption text-on-surface-variant mt-1">Asst. Trainer</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<span class="text-body-md font-medium text-tertiary">Digital Literacy</span>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-error"></span>
<span class="text-body-md">Away</span>
</div>
</td>
<td class="px-6 py-5">
<div class="flex items-center gap-1">
<span class="text-body-md font-bold">4.2</span>
<span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-caption text-on-surface-variant ml-1">(44 Reviews)</span>
</div>
</td>
<td class="px-6 py-5">
<span class="text-caption text-on-surface-variant italic">Unassigned</span>
</td>
<td class="px-6 py-5 text-right">
<button class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container rounded-lg">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<div class="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
<p class="text-caption text-on-surface-variant">Showing 1-10 of 148 staff members</p>
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface transition-colors">
<span class="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-xs font-bold">1</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface transition-colors text-xs font-bold">2</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface transition-colors text-xs font-bold">3</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface transition-colors">
<span class="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
</div>
</div>
</section>
</main>
<!-- Onboarding Modal (Flow Trigger) -->
<div class="fixed inset-0 z-[100] flex items-center justify-center hidden" id="onboardingModal">
<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="toggleModal('onboardingModal')"></div>
<div class="relative bg-surface w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden animate-fade-up">
<div class="bg-primary text-white p-8">
<div class="flex justify-between items-start">
<div>
<h3 class="font-display-md">New Staff Onboarding</h3>
<p class="text-white/70 font-label-md mt-1">Follow the 4-step wizard to register new talent.</p>
</div>
<button class="text-white/60 hover:text-white" onclick="toggleModal('onboardingModal')">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<div class="mt-8 flex justify-between items-center relative">
<div class="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
<div class="z-10 bg-secondary-fixed text-on-secondary-fixed w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
<div class="z-10 bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
<div class="z-10 bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
<div class="z-10 bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
</div>
</div>
<div class="p-8">
<form class="space-y-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant">Full Name</label>
<input class="w-full bg-surface-container-low border-outline-variant/40 rounded-lg p-3 focus:ring-primary focus:border-primary" placeholder="e.g. Rahul Verma" type="text"/>
</div>
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant">Primary Role</label>
<select class="w-full bg-surface-container-low border-outline-variant/40 rounded-lg p-3 focus:ring-primary focus:border-primary">
<option>Trainer</option>
<option>Counselor</option>
<option>Admin</option>
<option>Support Staff</option>
</select>
</div>
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant">Contact Email</label>
<input class="w-full bg-surface-container-low border-outline-variant/40 rounded-lg p-3 focus:ring-primary focus:border-primary" placeholder="name@sjkvy.org" type="email"/>
</div>
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant">Joined Date</label>
<input class="w-full bg-surface-container-low border-outline-variant/40 rounded-lg p-3 focus:ring-primary focus:border-primary" type="date"/>
</div>
</div>
<div class="pt-6 border-t border-outline-variant flex justify-end gap-3">
<button class="px-6 py-2 rounded-lg font-label-md hover:bg-surface-container transition-colors" onclick="toggleModal('onboardingModal')" type="button">Save Draft</button>
<button class="bg-primary text-white px-8 py-2 rounded-lg font-label-md flex items-center gap-2" type="button">
                            Next Step <span class="material-symbols-outlined">arrow_right_alt</span>
</button>
</div>
</form>
</div>
</div>
</div>
<!-- Floating Action Button for Mobile -->
<div class="md:hidden fixed bottom-6 right-6 z-50">
<button class="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center" onclick="toggleModal('onboardingModal')">
<span class="material-symbols-outlined text-3xl">person_add</span>
</button>
</div>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .sidebar-active-border {
            border-left: 4px solid #ffdea5;
        }
        .museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .bronze-divider {
            border-bottom: 1px solid rgba(119, 90, 25, 0.1);
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
        .glass-surface {
            background: rgba(252, 249, 248, 0.6);
            backdrop-filter: blur(12px);
        }
        .bento-card {
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
            transform: translateY(-2px);
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
