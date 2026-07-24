// GENERATED from handoff app/register.html — do not edit by hand. Regenerate: npm run convert
export const portal = "public";
export const title = "SJKVY | Institutional Registration";
export const html = `<main class="flex min-h-screen w-full relative">
<!-- Split-Screen Image Section (Architectural Aesthetic) -->
<section class="hidden lg:flex lg:w-1/2 relative h-screen sticky top-0 overflow-hidden">
<div class="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-background/20"></div>
<div class="absolute inset-0 z-0 scale-105 transition-transform duration-[10000ms] hover:scale-100" data-alt="A grand, minimalist architectural marvel featuring clean lines and warm stone textures. The structure is bathed in soft, early morning sunlight that highlights the natural silk-like textures of the facade. The perspective is from a low angle, emphasizing the authoritative and enduring nature of the institution. Shadows are deep and precise, creating a sense of meticulously structured intellectual rigor." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBqd-w1bJG4MeTA8gbE50MEl3pLm_swzIqp1PJT9GD6U0rNZI5_W3-UokfogLBnKry4t4X-MhQwoj7vHRTmA_dncpDX2ARfrXo9dHbZaH8ItJirSGkdu768bbGFKLjubnqZGG8YjvFvhAbMkIU7hrUjgj2rQ5bzE7r76PDIHxkeRoWNbJvvy3CCX00w4DhKWI4-sQ-q2INj1clFX8ECspAKzyt9-ji9TNmXX6KdY_Qn6nKOQubTY2g_')">
</div>
<!-- Branding Overlay -->
<div class="absolute bottom-margin-desktop left-margin-desktop z-20 max-w-md">
<h1 class="font-display-lg text-display-lg text-on-surface mb-4">SJKVY</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant/80 italic leading-relaxed">
                    "Fostering institutional excellence through structured progress and enduring heritage."
                </p>
<div class="mt-8 h-1 w-24 bg-tasar-gold"></div>
</div>
</section>
<!-- Registration Form Section -->
<section class="w-full lg:w-1/2 flex flex-col px-margin-mobile md:px-24 lg:px-24 py-12 lg:py-20 bg-background overflow-y-auto">
<!-- Header & Navigation -->
<header class="mb-12 flex justify-between items-center w-full">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary scale-110">account_balance</span>
<span class="font-display-md text-display-md tracking-tight text-primary">Portal</span>
</div>
<a class="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors duration-300 flex items-center gap-1 group" href="/login">
                    Existing User? Log In
                    <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
</a>
</header>
<!-- Form Content -->
<div class="max-w-md w-full mx-auto lg:mx-0">
<div class="mb-10">
<h2 class="font-display-md text-display-md text-on-surface mb-2">Create Account</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Begin your journey with Saksham Jharkhand Institutional Portal.</p>
</div>
<!-- Multi-Step Indicator -->
<div class="flex items-center gap-8 mb-12">
<div class="flex items-center gap-2 group cursor-pointer" onclick="setActiveStep(1)">
<span class="w-8 h-8 rounded-full border-2 border-tasar-gold bg-tasar-gold text-on-secondary flex items-center justify-center font-bold text-xs transition-all duration-300" id="step-1-circle">1</span>
<span class="font-label-md text-label-md text-on-surface transition-opacity">Basic Info</span>
</div>
<div class="h-px flex-1 bg-outline/20"></div>
<div class="flex items-center gap-2 group cursor-pointer" onclick="setActiveStep(2)">
<span class="w-8 h-8 rounded-full border-2 border-outline/30 text-on-surface-variant flex items-center justify-center font-bold text-xs transition-all duration-300" id="step-2-circle">2</span>
<span class="font-label-md text-label-md text-on-surface-variant transition-opacity">Location</span>
</div>
</div>
<form class="space-y-6" id="registrationForm">
<!-- Step 1: Personal Information -->
<div class="form-step-transition opacity-100 transform translate-x-0" id="step-1-content">
<div class="space-y-5">
<div class="group">
<label class="block font-label-md text-label-md text-on-surface-variant mb-1.5 transition-colors group-focus-within:text-primary">Full Name</label>
<input class="w-full bg-surface-container-low border border-outline/20 rounded-lg px-4 py-3.5 font-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none" placeholder="As per Aadhaar" type="text"/>
</div>
<div class="group">
<label class="block font-label-md text-label-md text-on-surface-variant mb-1.5 transition-colors group-focus-within:text-primary">Email Address</label>
<input class="w-full bg-surface-container-low border border-outline/20 rounded-lg px-4 py-3.5 font-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none" placeholder="institution@domain.org" type="email"/>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
<div class="group">
<label class="block font-label-md text-label-md text-on-surface-variant mb-1.5 transition-colors group-focus-within:text-primary">Mobile Number</label>
<div class="relative">
<span class="absolute left-4 top-1/2 -translate-y-1/2 font-label-md text-on-surface-variant/60">+91</span>
<input class="w-full bg-surface-container-low border border-outline/20 rounded-lg pl-12 pr-4 py-3.5 font-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none" placeholder="00000 00000" type="tel"/>
</div>
</div>
<div class="group">
<label class="block font-label-md text-label-md text-on-surface-variant mb-1.5 transition-colors group-focus-within:text-primary">Aadhaar Number</label>
<input class="w-full bg-surface-container-low border border-outline/20 rounded-lg px-4 py-3.5 font-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none" placeholder="XXXX XXXX XXXX" type="text"/>
</div>
</div>
</div>
<div class="mt-10">
<button class="w-full bg-primary text-on-primary font-label-md py-4 rounded-lg museum-shadow hover:bg-primary-container active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2" onclick="setActiveStep(2)" type="button">
                                Continue to Next Step
                                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
<!-- Step 2: Location Information (Hidden by default) -->
<div class="form-step-transition hidden opacity-0 transform translate-x-8" id="step-2-content">
<div class="space-y-5">
<div class="group">
<label class="block font-label-md text-label-md text-on-surface-variant mb-1.5 transition-colors group-focus-within:text-primary">District</label>
<select class="w-full bg-surface-container-low border border-outline/20 rounded-lg px-4 py-3.5 font-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer">
<option disabled="" selected="" value="">Select your district</option>
<option value="ranchi">Ranchi</option>
<option value="jamshedpur">Jamshedpur</option>
<option value="dhanbad">Dhanbad</option>
<option value="bokaro">Bokaro</option>
<option value="hazaribagh">Hazaribagh</option>
<option value="dumka">Dumka</option>
</select>
</div>
<div class="group">
<label class="block font-label-md text-label-md text-on-surface-variant mb-1.5 transition-colors group-focus-within:text-primary">Institutional Category</label>
<div class="grid grid-cols-2 gap-3">
<button class="border border-outline/20 rounded-lg py-3 px-4 text-left font-body-md hover:border-tasar-gold transition-colors flex items-center justify-between" type="button">
                                        Private 
                                        <span class="material-symbols-outlined text-[18px] text-tasar-gold opacity-0">check_circle</span>
</button>
<button class="border-2 border-tasar-gold rounded-lg py-3 px-4 text-left font-body-md bg-secondary-fixed/10 flex items-center justify-between" type="button">
                                        Government
                                        <span class="material-symbols-outlined text-[18px] text-tasar-gold" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</button>
</div>
</div>
<div class="pt-2">
<label class="flex items-start gap-3 cursor-pointer group">
<div class="mt-1">
<input class="w-5 h-5 rounded border-outline/30 text-primary focus:ring-primary transition-all" type="checkbox"/>
</div>
<span class="font-body-md text-on-surface-variant/80 group-hover:text-on-surface transition-colors">
                                        I hereby declare that the information provided is true to the best of my knowledge and I agree to the <a class="text-tasar-gold font-semibold underline underline-offset-4 decoration-tasar-gold/30" href="#">Institutional Privacy Policy</a>.
                                    </span>
</label>
</div>
</div>
<div class="mt-10 flex flex-col md:flex-row gap-4">
<button class="flex-1 border border-outline/20 text-on-surface-variant font-label-md py-4 rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2" onclick="setActiveStep(1)" type="button">
<span class="material-symbols-outlined text-[20px]">chevron_left</span>
                                Back
                            </button>
<button class="flex-[2] bg-primary text-on-primary font-label-md py-4 rounded-lg museum-shadow hover:shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2" type="submit">
                                Create Account
                                <span class="material-symbols-outlined text-[20px]">how_to_reg</span>
</button>
</div>
</div>
</form>
<!-- Footer Support -->
<footer class="mt-16 pt-8 border-t border-outline/10 flex flex-col md:flex-row justify-between items-center gap-6">
<p class="font-caption text-on-surface-variant/60">© 2024 SJKVY. All rights reserved.</p>
<div class="flex gap-6">
<a class="font-caption text-on-surface-variant/60 hover:text-secondary transition-colors" href="#">Security</a>
<a class="font-caption text-on-surface-variant/60 hover:text-secondary transition-colors" href="#">Terms</a>
<a class="font-caption text-on-surface-variant/60 hover:text-secondary transition-colors" href="#">Support</a>
</div>
</footer>
</div>
</section>
</main>
<!-- Interactive Layer for Form Steps -->`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .form-step-transition {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .text-tasar-gold { color: #775a19; }
        .bg-tasar-gold { background-color: #775a19; }
        .border-tasar-gold { border-color: #775a19; }
        
        .museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }

        /* Glass effect for the top-bar if visible on mobile */
        .glass-header {
            background: rgba(252, 249, 248, 0.6);
            backdrop-filter: blur(12px);
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
