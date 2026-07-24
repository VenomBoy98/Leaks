// GENERATED from handoff app/documents.html — do not edit by hand. Regenerate: npm run convert
export const portal = "applicant";
export const title = "SJKVY Portal | Document Management";
export const html = `<!-- Sidebar Navigation Shell -->
<nav class="fixed left-0 top-0 h-full w-[280px] bg-tertiary dark:bg-inverse-surface flex flex-col py-8 gap-base border-r border-outline/10 shadow-xl z-50">
<div class="px-8 mb-12">
<h1 class="font-display-md text-display-md text-surface dark:text-on-surface mb-1">Saksham Jharkhand</h1>
<p class="font-label-md text-label-md text-tertiary-fixed-dim uppercase tracking-widest opacity-80">Institutional Portal</p>
</div>
<div class="flex-1 flex flex-col gap-2">
<a class="flex items-center gap-4 text-tertiary-fixed-dim pl-8 py-3 font-normal hover:bg-tertiary-container/20 hover:text-on-tertiary-container transition-all" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md text-label-md">Dashboard</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim pl-8 py-3 font-normal hover:bg-tertiary-container/20 hover:text-on-tertiary-container transition-all" href="#">
<span class="material-symbols-outlined">edit_note</span>
<span class="font-label-md text-label-md">Application</span>
</a>
<!-- Active Tab: Documents -->
<a class="flex items-center gap-4 text-on-secondary bg-transparent border-l-4 border-secondary-fixed pl-[28px] py-3 font-bold" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">description</span>
<span class="font-label-md text-label-md">Documents</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim pl-8 py-3 font-normal hover:bg-tertiary-container/20 hover:text-on-tertiary-container transition-all" href="#">
<span class="material-symbols-outlined">hourglass_empty</span>
<span class="font-label-md text-label-md">Timeline</span>
</a>
</div>
<div class="px-8 mt-auto flex flex-col gap-2">
<a class="flex items-center gap-4 text-tertiary-fixed-dim py-2 hover:text-white transition-colors" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</a>
<a class="flex items-center gap-4 text-tertiary-fixed-dim py-2 hover:text-white transition-colors" href="#">
<span class="material-symbols-outlined">contact_support</span>
<span class="font-label-md text-label-md">Support</span>
</a>
</div>
</nav>
<!-- Top Bar Navigation Shell -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-[72px] bg-surface/60 backdrop-blur-md z-40 border-b border-secondary/20 shadow-sm flex items-center justify-between px-margin-desktop">
<div class="flex items-center gap-base">
<h2 class="font-display-md text-[24px] text-primary">Document Management</h2>
</div>
<div class="flex items-center gap-6">
<div class="flex items-center gap-4">
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Directory</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200 border-b-2 border-primary pb-1 font-bold" href="#">Resources</a>
</div>
<div class="h-8 w-px bg-outline/20"></div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform">notifications</button>
<button class="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform">help_outline</button>
<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden cursor-pointer border border-primary/20">
<img class="w-full h-full object-cover" data-alt="Professional headshot of an institutional administrator in a minimalist office setting with soft, natural lighting. The subject is wearing a dark green blazer over a white shirt, looking towards the camera with a confident, welcoming expression. The aesthetic is clean and high-end, matching the museum-quality UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_l21IG3zeoVAWsOgBuBv24SApN2fgmSxuTNRgv0MrcuNCy6f3KLISnoFmFNWsdV8vkOn-i2N6Q4-0w58yqkSVSEBSiIDMjziNioCH8apdrw10O6H846VN-fb7KDI5aL1BNMCBnFfRiTiAgYABL7zxWt0HkkURLDiLK9Gkhf4C1FELDEDV0OaHsp0A6OEJUo0EGamF15qwMGIum8l6VjAV4pfwoyMh2D-QTIHtyfZYqZ5ojG5D4z5K"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-[280px] pt-[104px] px-margin-desktop pb-12 max-w-max-width mx-auto">
<!-- Header Section -->
<section class="mb-12 staggered-entry" style="animation-delay: 0.1s">
<div class="flex justify-between items-end mb-8">
<div>
<h3 class="font-display-md text-display-md text-on-surface mb-2">Required Verification</h3>
<p class="text-on-surface-variant max-w-2xl font-body-lg">Please upload official copies of the documents listed below. Ensure all files are clear and under 5MB in PDF or JPEG format.</p>
</div>
<div class="flex gap-4">
<button class="px-6 py-2 border border-secondary text-secondary font-label-md rounded-lg hover:bg-secondary/5 transition-colors">Download Checklist</button>
</div>
</div>
<!-- Drag & Drop Zone -->
<div class="w-full h-48 bg-surface-container-lowest border-2 border-dashed border-outline rounded-xl flex flex-col items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-all duration-300">
<div class="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
<span class="material-symbols-outlined text-on-primary-fixed text-3xl">cloud_upload</span>
</div>
<p class="font-title-lg text-on-surface mb-1">Drag and drop files here</p>
<p class="text-on-surface-variant font-label-md">or <span class="text-primary font-bold hover:underline">browse files</span> from your computer</p>
</div>
</section>
<!-- Bento Table Container -->
<section class="staggered-entry" style="animation-delay: 0.2s">
<div class="bg-surface-container-lowest rounded-xl museum-shadow border silk-border overflow-hidden">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-high/50 border-b silk-border">
<th class="px-8 py-5 font-label-md text-primary tracking-widest uppercase">Document Name</th>
<th class="px-8 py-5 font-label-md text-primary tracking-widest uppercase">Status</th>
<th class="px-8 py-5 font-label-md text-primary tracking-widest uppercase text-right">Actions</th>
</tr>
</thead>
<tbody class="divide-y silk-border">
<!-- Row 1: Aadhaar Card -->
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="px-8 py-6">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-primary-fixed-dim/20 flex items-center justify-center">
<span class="material-symbols-outlined text-primary">id_card</span>
</div>
<div>
<p class="font-title-lg text-on-surface">Aadhaar Card</p>
<p class="text-caption text-on-surface-variant">Identity &amp; Address Proof</p>
</div>
</div>
</td>
<td class="px-8 py-6">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant font-label-md">
<span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    Verified
                                </div>
</td>
<td class="px-8 py-6 text-right">
<div class="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
<button class="flex items-center gap-2 px-4 py-2 text-primary font-label-md hover:bg-primary/5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">visibility</span>
                                        View
                                    </button>
<button class="flex items-center gap-2 px-4 py-2 text-secondary font-label-md hover:bg-secondary/5 rounded-lg border silk-border">
<span class="material-symbols-outlined text-[18px]">sync</span>
                                        Replace
                                    </button>
</div>
</td>
</tr>
<!-- Row 2: 10th Marksheet -->
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="px-8 py-6">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-secondary-fixed-dim/20 flex items-center justify-center">
<span class="material-symbols-outlined text-secondary">school</span>
</div>
<div>
<p class="font-title-lg text-on-surface">10th Marksheet</p>
<p class="text-caption text-on-surface-variant">Date of Birth Proof</p>
</div>
</div>
</td>
<td class="px-8 py-6">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/30 text-on-secondary-fixed-variant font-label-md">
<span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                                    Uploaded
                                </div>
</td>
<td class="px-8 py-6 text-right">
<div class="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
<button class="flex items-center gap-2 px-4 py-2 text-primary font-label-md hover:bg-primary/5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">visibility</span>
                                        View
                                    </button>
<button class="flex items-center gap-2 px-4 py-2 text-secondary font-label-md hover:bg-secondary/5 rounded-lg border silk-border">
<span class="material-symbols-outlined text-[18px]">sync</span>
                                        Replace
                                    </button>
</div>
</td>
</tr>
<!-- Row 3: Caste Certificate -->
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="px-8 py-6">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-error-container/20 flex items-center justify-center">
<span class="material-symbols-outlined text-error">badge</span>
</div>
<div>
<p class="font-title-lg text-on-surface">Caste Certificate</p>
<p class="text-caption text-on-surface-variant">Category Proof (if applicable)</p>
</div>
</div>
</td>
<td class="px-8 py-6">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md">
<span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                                    Pending
                                </div>
</td>
<td class="px-8 py-6 text-right">
<div class="flex items-center justify-end gap-3">
<button class="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary font-label-md rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all">
<span class="material-symbols-outlined text-[18px]">upload</span>
                                        Upload File
                                    </button>
</div>
</td>
</tr>
<!-- Row 4: Income Certificate -->
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="px-8 py-6">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span class="material-symbols-outlined text-on-surface-variant">receipt_long</span>
</div>
<div>
<p class="font-title-lg text-on-surface">Income Certificate</p>
<p class="text-caption text-on-surface-variant">Annual Family Income Proof</p>
</div>
</div>
</td>
<td class="px-8 py-6">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md">
<span class="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                    Optional
                                </div>
</td>
<td class="px-8 py-6 text-right">
<div class="flex items-center justify-end gap-3">
<button class="flex items-center gap-2 px-6 py-2 bg-surface-container-highest text-on-surface font-label-md rounded-lg hover:bg-surface-container-high transition-all">
<span class="material-symbols-outlined text-[18px]">upload</span>
                                        Upload
                                    </button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
<!-- Footer Help -->
<section class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 staggered-entry" style="animation-delay: 0.3s">
<div class="p-6 bg-surface-variant/30 rounded-xl border silk-border">
<span class="material-symbols-outlined text-primary mb-3">verified_user</span>
<h4 class="font-title-lg text-on-surface mb-2">Data Security</h4>
<p class="text-caption text-on-surface-variant">All documents are encrypted and stored in state-verified secure servers as per SJKVY guidelines.</p>
</div>
<div class="p-6 bg-surface-variant/30 rounded-xl border silk-border">
<span class="material-symbols-outlined text-primary mb-3">help</span>
<h4 class="font-title-lg text-on-surface mb-2">Need Assistance?</h4>
<p class="text-caption text-on-surface-variant">Contact our institutional helpdesk for queries regarding document validity or scan quality.</p>
</div>
<div class="p-6 bg-surface-variant/30 rounded-xl border silk-border">
<span class="material-symbols-outlined text-primary mb-3">history_edu</span>
<h4 class="font-title-lg text-on-surface mb-2">Digital Signature</h4>
<p class="text-caption text-on-surface-variant">Some documents may require e-KYC or Aadhaar-based digital signing after verification.</p>
</div>
</section>
</main>
<!-- FAB (Suppressed on Details Page based on logic, but added for Home context if needed) -->
<!-- <button class="fixed bottom-12 right-12 w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50">
        <span class="material-symbols-outlined text-3xl">add</span>
    </button> -->`;
export const css = `.museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .silk-border {
            border-color: rgba(119, 90, 25, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #fcf9f8;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e4e2e1;
            border-radius: 10px;
        }
        .staggered-entry {
            animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            opacity: 0;
            transform: translateY(10px);
        }
        @keyframes slideUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
