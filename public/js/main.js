document.addEventListener("DOMContentLoaded", () => {



    // Unified handling for all anime cards
    const allCards = document.querySelectorAll('.anime-card, .related-card');

    allCards.forEach(card => {
        card.addEventListener('click', () => {
            // Try to get anime name from data-anime on the card itself (franchise/related)
            // OR from the .anime-title child (anime-card)
            let animeName = card.getAttribute('data-anime');
            if (!animeName) {
                const titleElem = card.querySelector('.anime-title');
                if (titleElem) animeName = titleElem.dataset.anime;
            }

            if (animeName) {
                fetch('/description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: animeName })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.redirectUrl) {
                            window.location.href = data.redirectUrl;
                        } else {
                            // Fallback if no redirectUrl provided
                            console.error("No redirect URL in response");
                        }
                    })
                    .catch(error => console.error("Fetch error:", error));
            }
        });
    });

    // CUSTOM DROPDOWN LOGIC
    const wrapper = document.querySelector('.custom-select-wrapper');
    if (wrapper) {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const options = wrapper.querySelectorAll('.custom-option');
        const input = document.getElementById('statusInput');
        const triggerSpan = trigger.querySelector('span');

        trigger.addEventListener('click', (e) => {
            wrapper.classList.toggle('open');
            e.stopPropagation(); // Stop click from propagating to window
        });

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();

                // Set input value
                let value = option.getAttribute('data-value');
                if (value) value = value.trim();

                // Just update UI state (Text Only)
                // We do NOT change colors yet, that happens on Save
                input.value = value;
                if (value === 'remove') {
                    triggerSpan.textContent = 'Remove';
                } else if (value === 'planned') {
                    triggerSpan.textContent = 'Plan to Watch';
                } else {
                    // Capitalize first letter
                    triggerSpan.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                }

                // Handle styling
                wrapper.querySelector('.custom-option.selected')?.classList.remove('selected');
                option.classList.add('selected');

                // Close dropdown
                wrapper.classList.remove('open');
            });
        });

        // Close on click outside
        window.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });
    }

    // CAROUSEL NAVIGATION
    const carouselBtns = document.querySelectorAll('.carousel-btn');
    carouselBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent event bubbling just in case
            e.stopPropagation();

            const isRight = btn.classList.contains('right-btn');
            // Find the closest wrapper, then the container inside it
            // Or simpler: find sibling related-container
            const wrapper = btn.closest('.carousel-wrapper');
            const container = wrapper.querySelector('.related-container');

            if (container) {
                const scrollAmount = 300; // Adjust as needed
                if (isRight) {
                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                }
            }
        });
    });

});
