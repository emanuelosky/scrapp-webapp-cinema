<!-- src/lib/components/AuroraBackground.svelte -->
<div class="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#000000]">
    <div class="aurora-blob w-[500px] h-[500px] bg-orange-600/40 rounded-full blur-[100px] md:blur-[120px] top-[-10%] left-[-10%]"></div>
    <div class="aurora-blob w-[600px] h-[600px] bg-amber-600/30 rounded-full blur-[120px] md:blur-[150px] bottom-[-20%] right-[-10%] animation-delay-2000"></div>
    <div class="aurora-blob w-[400px] h-[400px] bg-red-900/40 rounded-full blur-[80px] md:blur-[100px] top-[40%] left-[30%] animation-delay-4000"></div>
    <div class="aurora-blob w-[550px] h-[550px] bg-purple-900/30 rounded-full blur-[130px] md:blur-[160px] top-[20%] right-[10%] animation-delay-1000"></div>
    <div class="aurora-blob w-[450px] h-[450px] bg-yellow-600/20 rounded-full blur-[90px] md:blur-[110px] bottom-[10%] left-[10%] animation-delay-3000"></div>
</div>

<style>
    .aurora-blob {
        position: absolute;
        animation: float 25s infinite ease-in-out alternate;
        will-change: transform, opacity;
    }

    @keyframes float {
        0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        33% { transform: translate(150px, -100px) scale(1.2); opacity: 0.8; }
        66% { transform: translate(-100px, 150px) scale(0.8); opacity: 0.4; }
        100% { transform: translate(100px, 100px) scale(1.1); opacity: 0.9; }
    }

    .animation-delay-1000 { animation-delay: -3s; }
    .animation-delay-2000 { animation-delay: -7s; }
    .animation-delay-3000 { animation-delay: -11s; }
    .animation-delay-4000 { animation-delay: -15s; }
</style>
