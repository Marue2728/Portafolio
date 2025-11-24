// Funcionalidad para el slider de brand identity
document.addEventListener('DOMContentLoaded', function() {
    const brandSlider = document.getElementById('brandSlider');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Navegación del slider
    nextBtn.addEventListener('click', function() {
        brandSlider.scrollBy({
            left: 320,
            behavior: 'smooth'
        });
    });
    
    prevBtn.addEventListener('click', function() {
        brandSlider.scrollBy({
            left: -320,
            behavior: 'smooth'
        });
    });

    // Funcionalidad para los modelos 3D
    const toggleRotateButtons = document.querySelectorAll('.toggle-rotate');
    const resetCameraButtons = document.querySelectorAll('.reset-camera');
    
    // Para cada visor 3D
    const viewers = [
        document.getElementById('pikachuViewer'),
        document.getElementById('castilloViewer'),
        document.getElementById('robotViewer')
    ];
    
    // Configurar botones para cada visor
    viewers.forEach((viewer, index) => {
        if (!viewer) return;
        
        const toggleBtn = toggleRotateButtons[index];
        const resetBtn = resetCameraButtons[index];
        
        let rotating = true;
        
        // Alternar auto-rotate
        toggleBtn.addEventListener('click', () => {
            rotating = !rotating;
            viewer.autoRotate = rotating;
            toggleBtn.textContent = rotating ? 'Detener rotación' : 'Reanudar rotación';
        });
        
        // Reset de la cámara
        resetBtn.addEventListener('click', () => {
            if (viewer.resetCamera) {
                viewer.resetCamera();
            }
        });
    });
});
