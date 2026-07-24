// GENERATED from handoff app/login.html — do not edit by hand. Regenerate: npm run convert
export const portal = "public";
export const title = "SJKVY Applicant Portal | Login";
export const html = `<main class="min-h-screen flex flex-col md:flex-row">
<!-- Visual Sidebar (Architectural Side) -->
<section class="relative w-full md:w-1/2 lg:w-[55%] h-[409px] md:h-screen overflow-hidden group">
<div class="absolute inset-0 z-0">
<div class="w-full h-full bg-cover bg-center transition-transform duration-[3000ms] group-hover:scale-110" data-alt="A grand architectural view of a modern university campus in Jharkhand featuring sustainable stone facades and large glass panels reflecting the lush greenery. The lighting is golden hour, casting long, soft shadows across clean stone walkways. The composition is wide and editorial, conveying a sense of prestige and institutional heritage. The color palette is dominated by warm stone tones and deep forest greens." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCyvwOCC2wO9_cbe7r0qc5LU7RGQtsBKS2SrCATn95S3ynZ-LjiY8OW9lBC7dF0I8pql-3boycq-QUD-40hn2tSJlyNJjCbb3xgvul8z6iYbxOD55lRNuAVYe_pKrKtJUbgRymI_Cr8fTLFN50-XnstIcelmOmANSlGjWSLkAHgdX0dvn7MxT8B0_Ul-CqW1aq1-V8nYJZBb-h9jAKF3aaHhtO68iRyA0mO64thWVfu9GPErdnF7PGC')"></div>
</div>
<!-- Branding Overlay -->
<div class="absolute inset-0 z-10 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent p-margin-mobile md:p-margin-desktop flex flex-col justify-end">
<div class="reveal-stagger max-w-xl">
<div class="flex items-center gap-4 mb-6">
<div class="w-12 h-12 bg-on-primary flex items-center justify-center rounded-lg shadow-xl">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'opsz' 32;">account_balance</span>
</div>
<h2 class="font-display-md text-display-md text-on-primary tracking-tight">Saksham Jharkhand</h2>
</div>
<p class="font-display-md text-display-md text-on-primary/90 leading-tight mb-4">
                        A Legacy of Excellence in Skills and Innovation.
                    </p>
<p class="font-body-lg text-body-lg text-on-primary/70 max-w-md">
                        Join the institutional portal to manage your applications, track progress, and access premium academic resources.
                    </p>
</div>
</div>
<!-- Floating Badge -->
<div class="absolute top-margin-desktop left-margin-desktop z-20 hidden md:block">
<div class="glass-effect px-6 py-3 border border-secondary/20 shadow-sm flex items-center gap-3">
<span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
<span class="font-label-md text-label-md text-on-surface tracking-widest uppercase">Portal v4.2</span>
</div>
</div>
</section>
<!-- Form Side (Login Canvas) -->
<section class="w-full md:w-1/2 lg:w-[45%] bg-surface flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto">
<div class="w-full max-w-md reveal-stagger">
<!-- Logo & Heading -->
<div class="mb-12">
<h1 class="font-display-md text-display-md text-primary mb-2">Welcome Back</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant">Access the SJKVY Applicant Portal to continue your journey.</p>
</div>
<!-- Login Form -->
<form class="space-y-8" id="loginForm" onsubmit="return false;">
<!-- Username Field -->
<div class="space-y-2">
<label class="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" for="username">Username / Registration ID</label>
<div class="relative group">
<div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
<span class="material-symbols-outlined">person</span>
</div>
<input class="w-full bg-surface-container-lowest border border-outline/20 px-12 py-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 placeholder:text-outline-variant font-body-md" id="username" name="username" placeholder="Enter your ID" type="text"/>
<div class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-focus-within:w-full"></div>
</div>
</div>
<!-- Password Field -->
<div class="space-y-2">
<div class="flex items-center justify-between">
<label class="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" for="password">Password</label>
<a class="font-label-md text-label-md text-primary hover:text-secondary transition-colors underline decoration-primary/20 underline-offset-4" href="#">Forgot Password?</a>
</div>
<div class="relative group">
<div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
<span class="material-symbols-outlined">lock</span>
</div>
<input class="w-full bg-surface-container-lowest border border-outline/20 px-12 py-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-300 placeholder:text-outline-variant font-body-md" id="password" name="password" placeholder="••••••••" type="password"/>
<button class="absolute inset-y-0 right-4 flex items-center text-outline hover:text-primary transition-colors" type="button">
<span class="material-symbols-outlined">visibility</span>
</button>
<div class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-focus-within:w-full"></div>
</div>
</div>
<!-- Remember Me -->
<div class="flex items-center">
<input class="w-4 h-4 text-primary border-outline/20 focus:ring-primary cursor-pointer" id="remember" type="checkbox"/>
<label class="ml-2 font-label-md text-label-md text-on-surface-variant cursor-pointer select-none" for="remember">Keep me logged in for 30 days</label>
</div>
<!-- Submit Button -->
<button class="w-full bg-primary text-on-primary py-5 font-label-md text-label-md uppercase tracking-[0.2em] shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group" type="submit">
                        Login to Portal
                        <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
</button>
</form>
<!-- Footer Links -->
<div class="mt-16 pt-8 border-t border-outline/10 flex flex-col gap-6">
<p class="font-caption text-on-surface-variant">
                        Don't have an account yet? 
                        <a class="text-primary font-bold hover:underline underline-offset-4" href="#">Register as a New Applicant</a>
</p>
<div class="flex items-center gap-4">
<a class="w-10 h-10 border border-outline/20 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all" href="#">
<span class="material-symbols-outlined">help_outline</span>
</a>
<a class="w-10 h-10 border border-outline/20 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all" href="#">
<span class="material-symbols-outlined">language</span>
</a>
<div class="ml-auto flex gap-6">
<a class="font-caption text-on-surface-variant hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
<a class="font-caption text-on-surface-variant hover:text-on-surface transition-colors" href="#">Terms of Service</a>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Micro-interaction Script -->`;
export const css = `body {
            background-color: #fcf9f8;
            color: #1b1c1b;
            overflow-x: hidden;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-effect {
            backdrop-filter: blur(12px);
            background: rgba(252, 249, 248, 0.6);
        }
        .reveal-stagger > * {
            opacity: 0;
            transform: translateY(10px);
            animation: reveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes reveal {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .reveal-stagger > *:nth-child(1) { animation-delay: 0.1s; }
        .reveal-stagger > *:nth-child(2) { animation-delay: 0.2s; }
        .reveal-stagger > *:nth-child(3) { animation-delay: 0.3s; }
        .reveal-stagger > *:nth-child(4) { animation-delay: 0.4s; }
        .reveal-stagger > *:nth-child(5) { animation-delay: 0.5s; }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
