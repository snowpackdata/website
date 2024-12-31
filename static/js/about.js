
const toggleMenuButton = document.getElementById('menuToggle');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const closeIcon = document.getElementById('closeIcon');
const mobileMenu = document.getElementById('mobile-menu');

toggleMenuButton.addEventListener('click', function(){
    mobileMenu.classList.toggle('hidden');
    hamburgerIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
});
