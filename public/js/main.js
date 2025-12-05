document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById('menuToggle');
    const navList = document.querySelector('.nav-menu ul');

    if (toggleButton && navList) {
        toggleButton.addEventListener('click', () => {
            navList.classList.toggle('nav-open');
        });
    }

    // Listen for clicks on anime cards
    const animeCards = document.querySelectorAll('.anime-card');

    animeCards.forEach(card => {
        card.addEventListener('click', () => {
            const animeElement = card.querySelector('.anime-title');
            const animeName = animeElement ? animeElement.innerText.trim() : null;

            if (animeName) {
                // Send the selected anime name to the server
                fetch('/description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: animeName }),
                })
                    .then(response => {
                        if (response.redirected) {
                            // if backend renders a new page, follow redirect
                            window.location.href = response.url;
                        } else {
                            return response.text();
                        }
                    })
                    .catch(error => console.error("Fetch error:", error));
            }
        });
    });
});
