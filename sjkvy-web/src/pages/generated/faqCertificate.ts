// GENERATED from Stitch export 0b15496d-stitch_sjkvy_integrated_digital_ecosystem_5 — do not edit by hand.
// Regenerate with: npm run convert
export const html = `<!-- Top Navigation Bar -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-surface/60 backdrop-blur-md border-b border-secondary/10 h-topbar-height flex items-center shadow-sm">
<div class="flex justify-between items-center w-full px-margin-desktop max-w-max-width mx-auto">
<div class="font-display-md text-display-md font-semibold text-primary">SJKVY</div>
<div class="hidden md:flex items-center gap-8">
<a class="text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md" href="#">Schemes</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md" href="#">Centers</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md" href="#">Resources</a>
<a class="text-primary border-b-2 border-secondary font-semibold font-body-md" href="#">Success Stories</a>
</div>
<button class="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md hover:bg-primary-container transition-all duration-200">Portal Login</button>
</div>
</nav>
<!-- Side Navigation (Suppressed for this task-focused utility page as per Shell Rules, but defined in JSON) -->
<main class="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
<!-- Header Section -->
<header class="mb-16 text-center max-w-2xl mx-auto">
<h1 class="font-display-lg text-display-lg text-primary mb-4">Support &amp; Verification</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant">Find answers to frequently asked questions about our skill development programs or verify the authenticity of your institutional certifications.</p>
</header>
<!-- Main Content: Asymmetric Layout -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
<!-- Left Column: Verification Tool (Prominent Area) -->
<section class="lg:col-span-5 order-1 lg:order-1">
<div class="bg-surface-container-lowest p-8 md:p-12 rounded-xl border-t-2 border-primary museum-shadow institutional-seal relative overflow-hidden">
<!-- Subtle watermark aesthetic -->
<div class="absolute -right-12 -top-12 opacity-[0.03] select-none pointer-events-none">
<span class="material-symbols-outlined text-[240px]">verified_user</span>
</div>
<div class="relative z-10">
<div class="flex items-center gap-3 mb-8">
<span class="material-symbols-outlined text-secondary text-4xl">verified</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface">Verify Certificate</h2>
</div>
<p class="font-body-md text-on-surface-variant mb-8 leading-relaxed">
                            Enter the unique identification number located at the bottom left of your SJKVY Certificate to validate its authenticity against our central registry.
                        </p>
<form class="space-y-6" id="verifyForm">
<div class="space-y-2">
<label class="font-label-md text-on-surface-variant" for="certId">Certificate ID</label>
<div class="relative">
<input class="w-full bg-surface border border-on-surface-variant/20 rounded-lg px-4 py-4 font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300" id="certId" placeholder="e.g. SJKVY-2024-8842" type="text"/>
<span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40">qr_code_scanner</span>
</div>
</div>
<button class="w-full bg-primary text-on-primary py-4 rounded-lg font-title-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-all duration-300 transform hover:-translate-y-1" type="submit">
<span>Verify Credentials</span>
<span class="material-symbols-outlined">arrow_forward</span>
</button>
</form>
<div class="mt-8 hidden p-4 rounded-lg border border-secondary/20 bg-secondary-fixed/10 animate-fade-in" id="verifyResult">
<div class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary">check_circle</span>
<div>
<p class="font-label-md text-primary">Valid Certificate Found</p>
<p class="text-caption text-on-surface-variant">Issued to: Rohan Sharma • June 2024</p>
</div>
</div>
</div>
<div class="mt-12 pt-8 border-t border-on-surface-variant/10 flex items-center gap-4">
<div class="w-12 h-12 rounded-full overflow-hidden grayscale opacity-50">
<img class="object-cover w-full h-full" data-alt="A close-up, high-quality photograph of a golden institutional seal embossed on premium textured ivory paper, showing intricate details of an emblem and surrounding text in a minimalist museum aesthetic." src="/img/44bfbf424b3db941.jpg"/>
</div>
<p class="text-caption text-on-surface-variant italic leading-tight">
                                This verification portal is part of the SJKVY Integrity Framework, ensuring excellence in skill development across all national centers.
                            </p>
</div>
</div>
</div>
</section>
<!-- Right Column: FAQ Accordion -->
<section class="lg:col-span-7 order-2 lg:order-2">
<div class="space-y-4">
<div class="mb-8">
<h2 class="font-headline-lg text-headline-lg text-primary mb-2">Common Inquiries</h2>
<div class="h-1 w-20 bg-secondary/30 rounded-full"></div>
</div>
<!-- Accordion Item 1 -->
<div class="accordion-item bg-surface-container-low rounded-lg transition-all duration-300 hover:bg-surface-container">
<button class="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none group" onclick="toggleAccordion(this)">
<span class="font-title-lg text-on-surface group-hover:text-primary transition-colors">How do I enroll in a scheme?</span>
<span class="material-symbols-outlined rotate-icon transition-transform text-on-surface-variant">expand_more</span>
</button>
<div class="accordion-content px-6 border-l-2 border-secondary/0 transition-all">
<div class="pb-6 text-body-md text-on-surface-variant leading-relaxed">
                                Enrollment is simple. Visit your nearest certified center with your digital ID. Our counselors will guide you through the skill mapping process to ensure you choose the scheme best suited for your career goals.
                            </div>
</div>
</div>
<!-- Accordion Item 2 -->
<div class="accordion-item bg-surface-container-low rounded-lg transition-all duration-300 hover:bg-surface-container">
<button class="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none group" onclick="toggleAccordion(this)">
<span class="font-title-lg text-on-surface group-hover:text-primary transition-colors">Are the certifications globally recognized?</span>
<span class="material-symbols-outlined rotate-icon transition-transform text-on-surface-variant">expand_more</span>
</button>
<div class="accordion-content px-6">
<div class="pb-6 text-body-md text-on-surface-variant leading-relaxed">
                                Yes, SJKVY certificates adhere to international vocational standards. We partner with global industry leaders to ensure that the skills you acquire are relevant and respected in job markets worldwide.
                            </div>
</div>
</div>
<!-- Accordion Item 3 -->
<div class="accordion-item bg-surface-container-low rounded-lg transition-all duration-300 hover:bg-surface-container">
<button class="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none group" onclick="toggleAccordion(this)">
<span class="font-title-lg text-on-surface group-hover:text-primary transition-colors">What happens if I lose my certificate?</span>
<span class="material-symbols-outlined rotate-icon transition-transform text-on-surface-variant">expand_more</span>
</button>
<div class="accordion-content px-6">
<div class="pb-6 text-body-md text-on-surface-variant leading-relaxed">
                                Physical replacements can be requested at your parent center for a nominal processing fee. However, your digital record is permanent. You can always use this portal to verify your achievement for employers using your ID.
                            </div>
</div>
</div>
<!-- Accordion Item 4 -->
<div class="accordion-item bg-surface-container-low rounded-lg transition-all duration-300 hover:bg-surface-container">
<button class="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none group" onclick="toggleAccordion(this)">
<span class="font-title-lg text-on-surface group-hover:text-primary transition-colors">Can I switch courses after starting?</span>
<span class="material-symbols-outlined rotate-icon transition-transform text-on-surface-variant">expand_more</span>
</button>
<div class="accordion-content px-6">
<div class="pb-6 text-body-md text-on-surface-variant leading-relaxed">
                                Course switching is permitted within the first 10 days of training. After this period, students are encouraged to complete their current module to receive partial credits before embarking on a new specialization.
                            </div>
</div>
</div>
<!-- Accordion Item 5 -->
<div class="accordion-item bg-surface-container-low rounded-lg transition-all duration-300 hover:bg-surface-container">
<button class="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none group" onclick="toggleAccordion(this)">
<span class="font-title-lg text-on-surface group-hover:text-primary transition-colors">Is there placement assistance provided?</span>
<span class="material-symbols-outlined rotate-icon transition-transform text-on-surface-variant">expand_more</span>
</button>
<div class="accordion-content px-6">
<div class="pb-6 text-body-md text-on-surface-variant leading-relaxed">
                                Absolutely. We host quarterly 'Skill Fairs' connecting graduates directly with over 200 corporate partners. Our dedicated career cell also provides mock interview training and resume building workshops.
                            </div>
</div>
</div>
</div>
<!-- Contact Support CTA -->
<div class="mt-12 p-8 rounded-xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
<div>
<h3 class="font-title-lg text-primary mb-1">Still have questions?</h3>
<p class="font-body-md text-on-surface-variant">Our support desk is available 24/7 for institutional queries.</p>
</div>
<a class="bg-surface text-secondary border border-secondary px-8 py-3 rounded-lg font-label-md hover:bg-secondary/5 transition-colors whitespace-nowrap" href="mailto:support@sjvky.gov.in">
                        Email Support
                    </a>
</div>
</section>
</div>
<!-- Visual Anchor: Pattern/Divider -->
<div class="mt-24 bronze-divider"></div>
</main>
<!-- Footer -->
<footer class="bg-surface-container-lowest border-t border-secondary/20">
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-12 max-w-max-width mx-auto">
<div class="col-span-1 md:col-span-2">
<div class="font-display-md text-display-md text-primary mb-4">SJKVY</div>
<p class="text-on-surface-variant max-w-sm mb-6">
                    Dedicated to empowering the nation through systematic skill assessment and world-class vocational training infrastructure.
                </p>
<div class="flex gap-4">
<span class="material-symbols-outlined text-secondary hover:opacity-70 cursor-pointer">public</span>
<span class="material-symbols-outlined text-secondary hover:opacity-70 cursor-pointer">school</span>
<span class="material-symbols-outlined text-secondary hover:opacity-70 cursor-pointer">hub</span>
</div>
</div>
<div>
<h4 class="font-label-md text-primary mb-4">Institutional</h4>
<ul class="space-y-2">
<li><a class="text-caption text-on-surface-variant hover:text-secondary underline decoration-secondary/30 transition-all" href="#">Profile</a></li>
<li><a class="text-caption text-on-surface-variant hover:text-secondary underline decoration-secondary/30 transition-all" href="#">Impact Report</a></li>
<li><a class="text-caption text-on-surface-variant hover:text-secondary underline decoration-secondary/30 transition-all" href="#">Governance</a></li>
</ul>
</div>
<div>
<h4 class="font-label-md text-primary mb-4">Support</h4>
<ul class="space-y-2">
<li><a class="text-caption text-on-surface-variant hover:text-secondary underline decoration-secondary/30 transition-all" href="#">Privacy Policy</a></li>
<li><a class="text-caption text-on-surface-variant hover:text-secondary underline decoration-secondary/30 transition-all" href="#">Contact</a></li>
<li><a class="text-caption text-on-surface-variant hover:text-secondary underline decoration-secondary/30 transition-all" href="#">Help Center</a></li>
</ul>
</div>
</div>
<div class="px-margin-desktop py-6 bg-surface-container text-center">
<p class="text-caption text-on-surface-variant opacity-70">
                © 2024 SJKVY. All rights reserved. Institutional excellence in skill development.
            </p>
</div>
</footer>`;
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
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(119, 90, 25, 0.2), transparent);
        }

        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .accordion-item.active .accordion-content {
            max-height: 200px;
        }

        .accordion-item.active .rotate-icon {
            transform: rotate(180deg);
        }

        .institutional-seal {
            background: radial-gradient(circle at center, transparent 60%, rgba(49, 99, 66, 0.05) 100%);
        }`;
