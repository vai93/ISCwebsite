document.addEventListener('DOMContentLoaded', () => {
    const fixedButton = document.querySelector('.fixed-button');
    const fixedSection = document.querySelector('.fixed-section');

    window.addEventListener('scroll', () => {
        const rect = fixedSection.getBoundingClientRect();
        const inView = rect.top <= 0 && rect.bottom >= 0;

        if (inView) {
            fixedButton.classList.add('fixed');
        } else {
            fixedButton.classList.remove('fixed');
        }
    });
});
