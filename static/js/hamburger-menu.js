document.addEventListener("DOMContentLoaded", function() {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const menuItems = document.querySelector('.menu-items');
    
    // Toggle menu on hamburger button click
    hamburgerButton.addEventListener('click', function() {
        this.classList.toggle('active');
        menuItems.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!hamburgerButton.contains(event.target) && !menuItems.contains(event.target)) {
            hamburgerButton.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hamburgerButton.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });
});
