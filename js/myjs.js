window.onscroll = function() {
    scrollFunction();
  };

  function scrollFunction() {
    var scrollToTopBtn = document.getElementById("scrollToTop");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      scrollToTopBtn.style.display = "block";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  }

  // Smooth scroll to the top when the button is clicked
  document.getElementById('scrollToTop').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default link behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });