// GENERATED from handoff app/admin-assessments.html — do not edit by hand. Regenerate: npm run convert
export const portal = "admin";
export const title = "SJKVY Portal - Assessments & Grading";
export const html = `<!-- Side Navigation Bar -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-xl flex flex-col py-8 z-50">
<div class="px-6 mb-12">
<h1 class="font-headline-lg text-28px text-secondary-fixed tracking-tight leading-tight">SJKVY Portal</h1>
<p class="font-label-sm text-xs text-on-primary/70 uppercase tracking-widest mt-1">Centre Admin</p>
</div>
<nav class="flex-1 space-y-1">
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
<a class="flex items-center px-6 py-3 bg-white/10 text-secondary-fixed font-bold border-l-4 border-secondary-fixed" href="#">
<span class="material-symbols-outlined mr-4">assessment</span>
<span class="font-label-md">Reports</span>
</a>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">group</span>
<span class="font-label-md">Directory</span>
</a>
<a class="flex items-center px-6 py-3 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined mr-4">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
</nav>
<div class="px-6 mt-auto space-y-4">
<button class="w-full py-3 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-lg transition-transform active:scale-95">
        Quick Enroll
      </button>
<div class="pt-6 border-t border-white/10 space-y-1">
<a class="flex items-center py-2 text-on-primary/60 hover:text-on-primary transition-colors" href="#">
<span class="material-symbols-outlined mr-4 text-sm">settings</span>
<span class="font-label-md text-xs">Settings</span>
</a>
<a class="flex items-center py-2 text-on-primary/60 hover:text-on-primary transition-colors" href="#">
<span class="material-symbols-outlined mr-4 text-sm">help</span>
<span class="font-label-md text-xs">Support</span>
</a>
</div>
</div>
</aside>
<!-- Top App Bar -->
<header class="flex justify-between items-center ml-72 px-gutter h-20 bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant">
<div class="flex items-center gap-6">
<div class="relative group">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full w-64 focus:ring-2 focus:ring-primary/20 transition-all text-body-md" placeholder="Search assessments..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6">
<button class="text-on-surface-variant hover:text-primary transition-colors relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="h-10 w-[1px] bg-outline-variant"></div>
<div class="flex items-center gap-3">
<div class="text-right">
<p class="font-label-md text-on-surface">Aditi Sharma</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-wider">Centre Head</p>
</div>
<div class="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden">
<img class="w-full h-full object-cover" data-alt="Professional studio portrait of an Indian woman in her late 30s wearing a smart dark green blazer over a traditional silk saree. The lighting is soft and even, typical of a high-end institutional profile photograph. The background is a clean, neutral grey, emphasizing her confident and warm expression suitable for a senior academic administrator." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkJaXKRbzbPs-ycEvWyjgMluxi7Sv81e4Aa4h_eTcwXcjqqguHPWNK2FhvRtN3kPvHv1M8L4Vr2SW5P5dE_KVoHAt4x9V0ldTi3eBhnvS3aBYpZ4BQRhBVc49bjClsPZWg0UA-_bO-DZQwfb2ETaEN8VoHlk_TgSNqdfmIiBqdxe37l3UdyA2hSCITNF5T3Qq60KAaXW0nZ_H8nV7hDPfN58oYj_lUS0Kjt60PGq_WZlHJCYE6Em-h"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-72 p-12 max-w-[1440px] animate-fade-up">
<!-- Header Section -->
<section class="mb-12 flex justify-between items-end">
<div>
<h2 class="font-headline-lg text-48px text-primary mb-2">Assessments & Grading</h2>
<p class="text-body-lg text-on-surface-variant max-w-2xl">
          Comprehensive oversight of examination lifecycles. Manage grading protocols, visualize batch performance, and generate academic transcripts for all enrolled candidates.
        </p>
</div>
<div class="flex gap-4">
<button class="px-6 py-3 border border-secondary text-secondary font-semibold hover:bg-secondary/5 transition-weighted rounded-lg flex items-center gap-2">
<span class="material-symbols-outlined">upload_file</span>
          Import Results
        </button>
<button class="px-6 py-3 bg-primary text-white font-semibold hover:bg-primary-container transition-weighted rounded-lg flex items-center gap-2 museum-shadow">
<span class="material-symbols-outlined">add_task</span>
          Schedule Exam
        </button>
</div>
</section>
<!-- Bento Grid for Analytics & Management -->
<div class="grid grid-cols-12 gap-8 mb-12">
<!-- Batch-wise Result Analysis (Main Visualization) -->
<div class="col-span-8 bg-white border border-secondary/20 museum-shadow p-8 rounded-xl relative overflow-hidden">
<div class="flex justify-between items-center mb-8">
<div>
<h3 class="font-title-lg text-on-surface">Batch-wise Result Analysis</h3>
<p class="font-label-md text-on-surface-variant opacity-60">Academic Year 2023-24 (Q3)</p>
</div>
<select class="bg-surface-container-low border-none rounded-lg text-sm font-label-md focus:ring-primary">
<option>All Sectors</option>
<option>Healthcare</option>
<option>Digital Literacy</option>
</select>
</div>
<!-- Simulated Chart Visualization -->
<div class="h-64 flex items-end justify-between gap-4 relative">
<!-- Horizontal Grid Lines -->
<div class="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
<div class="border-b border-on-background w-full"></div>
<div class="border-b border-on-background w-full"></div>
<div class="border-b border-on-background w-full"></div>
<div class="border-b border-on-background w-full"></div>
</div>
<!-- Bar 1 -->
<div class="flex-1 flex flex-col items-center group cursor-pointer">
<div class="w-full bg-primary-fixed-dim rounded-t-sm h-[70%] transition-weighted group-hover:bg-primary relative">
<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">82% Pass</div>
</div>
<span class="mt-4 font-label-md text-[10px] uppercase text-on-surface-variant truncate w-full text-center">Batch A-22</span>
</div>
<!-- Bar 2 -->
<div class="flex-1 flex flex-col items-center group cursor-pointer">
<div class="w-full bg-primary-fixed-dim rounded-t-sm h-[92%] transition-weighted group-hover:bg-primary relative">
<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">94% Pass</div>
</div>
<span class="mt-4 font-label-md text-[10px] uppercase text-on-surface-variant truncate w-full text-center">Batch B-09</span>
</div>
<!-- Bar 3 -->
<div class="flex-1 flex flex-col items-center group cursor-pointer">
<div class="w-full bg-primary-fixed-dim rounded-t-sm h-[45%] transition-weighted group-hover:bg-primary relative">
<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">61% Pass</div>
</div>
<span class="mt-4 font-label-md text-[10px] uppercase text-on-surface-variant truncate w-full text-center">Batch C-15</span>
</div>
<!-- Bar 4 -->
<div class="flex-1 flex flex-col items-center group cursor-pointer">
<div class="w-full bg-primary-fixed-dim rounded-t-sm h-[80%] transition-weighted group-hover:bg-primary relative">
<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">88% Pass</div>
</div>
<span class="mt-4 font-label-md text-[10px] uppercase text-on-surface-variant truncate w-full text-center">Batch D-04</span>
</div>
<!-- Bar 5 -->
<div class="flex-1 flex flex-col items-center group cursor-pointer">
<div class="w-full bg-primary-fixed-dim rounded-t-sm h-[65%] transition-weighted group-hover:bg-primary relative">
<div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">74% Pass</div>
</div>
<span class="mt-4 font-label-md text-[10px] uppercase text-on-surface-variant truncate w-full text-center">Batch E-11</span>
</div>
</div>
</div>
<!-- Quick Stats -->
<div class="col-span-4 space-y-6">
<div class="bg-primary text-white p-6 rounded-xl museum-shadow flex justify-between items-center overflow-hidden relative">
<div>
<p class="font-label-md uppercase tracking-widest text-on-primary-container text-xs mb-1">Avg. Passing Rate</p>
<p class="text-4xl font-headline-lg">78.4%</p>
</div>
<div class="p-3 bg-white/10 rounded-full">
<span class="material-symbols-outlined text-4xl">trending_up</span>
</div>
<div class="absolute -right-4 -bottom-4 opacity-5 rotate-12">
<span class="material-symbols-outlined text-[120px]">verified</span>
</div>
</div>
<div class="bg-surface-container border border-outline-variant/30 p-6 rounded-xl">
<p class="font-label-md uppercase tracking-widest text-on-surface-variant text-xs mb-4">Upcoming Examinations</p>
<div class="space-y-4">
<div class="flex items-center gap-4">
<div class="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-secondary">event</span>
</div>
<div>
<p class="font-label-md text-on-surface">Data Analysis Mid-term</p>
<p class="text-[10px] text-on-surface-variant">Oct 24 • Batch B-09</p>
</div>
</div>
<div class="flex items-center gap-4">
<div class="w-10 h-10 bg-tertiary-fixed rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-tertiary">event</span>
</div>
<div>
<p class="font-label-md text-on-surface">Digital Marketing Viva</p>
<p class="text-[10px] text-on-surface-variant">Oct 26 • Batch D-04</p>
</div>
</div>
</div>
</div>
</div>
</div>
<!-- Active Schedules & Grading Table -->
<section class="bg-white rounded-xl border border-secondary/10 museum-shadow overflow-hidden">
<div class="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
<h3 class="font-title-lg text-primary">Pending Grading & Transcripts</h3>
<div class="flex items-center gap-3">
<button class="p-2 hover:bg-surface-container rounded-lg transition-colors">
<span class="material-symbols-outlined">filter_list</span>
</button>
<button class="p-2 hover:bg-surface-container rounded-lg transition-colors">
<span class="material-symbols-outlined">more_vert</span>
</button>
</div>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead>
<tr class="bg-surface-container-low">
<th class="px-8 py-4 font-label-md text-secondary uppercase tracking-wider text-[11px]">Batch Name</th>
<th class="px-8 py-4 font-label-md text-secondary uppercase tracking-wider text-[11px]">Assessment Type</th>
<th class="px-8 py-4 font-label-md text-secondary uppercase tracking-wider text-[11px]">Candidate Count</th>
<th class="px-8 py-4 font-label-md text-secondary uppercase tracking-wider text-[11px]">Status</th>
<th class="px-8 py-4 font-label-md text-secondary uppercase tracking-wider text-[11px]">Action</th>
</tr>
</thead>
<tbody class="divide-y divide-secondary/10">
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-8 py-5">
<div class="flex flex-col">
<span class="font-bold text-on-surface">Healthcare Assistant (HCA-01)</span>
<span class="text-[10px] text-on-surface-variant">Last activity: 2 hours ago</span>
</div>
</td>
<td class="px-8 py-5 text-body-md text-on-surface-variant">Final Theory Exam</td>
<td class="px-8 py-5">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-dim"></div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-dim"></div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-dim"></div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center text-[10px] font-bold">+22</div>
</div>
</td>
<td class="px-8 py-5">
<span class="px-3 py-1 bg-error-container text-on-error-container text-[11px] font-bold rounded-full uppercase tracking-tighter">Pending Grading</span>
</td>
<td class="px-8 py-5">
<button class="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                  Enter Marks <span class="material-symbols-outlined text-sm">arrow_forward_ios</span>
</button>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-8 py-5">
<div class="flex flex-col">
<span class="font-bold text-on-surface">Financial Literacy (FIN-24)</span>
<span class="text-[10px] text-on-surface-variant">Last activity: 1 day ago</span>
</div>
</td>
<td class="px-8 py-5 text-body-md text-on-surface-variant">Monthly Progress Viva</td>
<td class="px-8 py-5">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-dim"></div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-dim"></div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center text-[10px] font-bold">+14</div>
</div>
</td>
<td class="px-8 py-5">
<span class="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold rounded-full uppercase tracking-tighter">Graded</span>
</td>
<td class="px-8 py-5">
<button class="text-secondary font-bold text-sm hover:underline flex items-center gap-1">
                  View Result <span class="material-symbols-outlined text-sm">arrow_forward_ios</span>
</button>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-8 py-5">
<div class="flex flex-col">
<span class="font-bold text-on-surface">Apparel Design (ADP-08)</span>
<span class="text-[10px] text-on-surface-variant">Last activity: 3 days ago</span>
</div>
</td>
<td class="px-8 py-5 text-body-md text-on-surface-variant">Practical Assessment</td>
<td class="px-8 py-5">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-dim"></div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center text-[10px] font-bold">+38</div>
</div>
</td>
<td class="px-8 py-5">
<span class="px-3 py-1 bg-secondary-container text-on-secondary-fixed-variant text-[11px] font-bold rounded-full uppercase tracking-tighter">Transcripts Ready</span>
</td>
<td class="px-8 py-5">
<button class="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                  Generate All <span class="material-symbols-outlined text-sm">download</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<div class="p-6 bg-surface-container-low flex items-center justify-between">
<p class="text-[12px] text-on-surface-variant">Showing 3 of 12 active assessment batches</p>
<div class="flex gap-2">
<button class="p-2 border border-outline-variant rounded hover:bg-white transition-colors"><span class="material-symbols-outlined text-sm">chevron_left</span></button>
<button class="p-2 border border-outline-variant rounded hover:bg-white transition-colors"><span class="material-symbols-outlined text-sm">chevron_right</span></button>
</div>
</div>
</section>
<!-- Transcripts & Certificates Spotlight -->
<section class="mt-12 grid grid-cols-3 gap-8">
<div class="bg-surface-container-highest/30 p-8 rounded-xl border-t-2 border-primary relative group cursor-pointer hover:shadow-lg transition-weighted">
<div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white mb-6">
<span class="material-symbols-outlined">verified_user</span>
</div>
<h4 class="font-title-lg text-on-surface mb-2">Transcript Verification</h4>
<p class="text-body-md text-on-surface-variant">Audit and verify digital transcripts before issuance to ensure alignment with sector standards.</p>
<div class="mt-6 flex items-center text-primary font-bold group-hover:gap-2 transition-all">
          Audit Now <span class="material-symbols-outlined">arrow_right_alt</span>
</div>
</div>
<div class="bg-surface-container-highest/30 p-8 rounded-xl border-t-2 border-secondary relative group cursor-pointer hover:shadow-lg transition-weighted">
<div class="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white mb-6">
<span class="material-symbols-outlined">history_edu</span>
</div>
<h4 class="font-title-lg text-on-surface mb-2">Grading Protocols</h4>
<p class="text-body-md text-on-surface-variant">Define and adjust weighted grading schemes for different skill sectors and assessment levels.</p>
<div class="mt-6 flex items-center text-secondary font-bold group-hover:gap-2 transition-all">
          Manage Rules <span class="material-symbols-outlined">arrow_right_alt</span>
</div>
</div>
<div class="bg-surface-container-highest/30 p-8 rounded-xl border-t-2 border-tertiary-container relative group cursor-pointer hover:shadow-lg transition-weighted">
<div class="w-12 h-12 bg-tertiary-container rounded-full flex items-center justify-center text-white mb-6">
<span class="material-symbols-outlined">auto_graph</span>
</div>
<h4 class="font-title-lg text-on-surface mb-2">Cohort Comparison</h4>
<p class="text-body-md text-on-surface-variant">Run comparative analytics between different centers or historical batch performance trends.</p>
<div class="mt-6 flex items-center text-tertiary font-bold group-hover:gap-2 transition-all">
          Run Report <span class="material-symbols-outlined">arrow_right_alt</span>
</div>
</div>
</section>
</main>
<!-- Interactive Overlay Logic (Simple Script) -->`;
export const css = `.material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .glass-surface {
      background: rgba(252, 249, 248, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .museum-shadow {
      box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
    }
    .bronze-divider {
      border-bottom: 1px solid rgba(119, 90, 25, 0.1);
    }
    .transition-weighted {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-up {
      animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .sidebar-active-indicator {
      border-left: 4px solid #ffdea5; /* secondary-fixed */
    }
  
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
