document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    let chatHistory = [];

    // Simple reveal animation on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        // Simple markdown-to-html for bold and lists
        const formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/^\* (.*)/gm, '<li>$1</li>');
        
        messageDiv.innerHTML = formattedText;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleChat = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        userInput.value = '';
        
        // Add a loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'system');
        loadingDiv.innerHTML = '<em>BharatVoter is thinking...</em>';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: chatHistory })
            });

            const data = await response.json();
            
            chatMessages.removeChild(loadingDiv);

            if (data.error) {
                addMessage("I'm sorry, I encountered an error. Please make sure the API key is configured correctly.", 'system');
            } else {
                addMessage(data.response, 'system');
                chatHistory.push({ role: 'user', parts: [{ text: message }] });
                chatHistory.push({ role: 'model', parts: [{ text: data.response }] });
            }
        } catch (error) {
            chatMessages.removeChild(loadingDiv);
            addMessage("Unable to connect to the server. Is it running?", 'system');
        }
    };

    sendBtn.addEventListener('click', handleChat);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    // Comprehensive list of Indian States and UTs with CEO links
    const statesData = [
        { name: "Andhra Pradesh", url: "https://ceoandhra.nic.in" },
        { name: "Arunachal Pradesh", url: "https://ceoarunachal.nic.in" },
        { name: "Assam", url: "https://ceoassam.nic.in" },
        { name: "Bihar", url: "https://ceobihar.nic.in" },
        { name: "Chhattisgarh", url: "https://ceochhattisgarh.nic.in" },
        { name: "Goa", url: "https://ceogoa.nic.in" },
        { name: "Gujarat", url: "https://ceo.gujarat.gov.in" },
        { name: "Haryana", url: "https://ceoharyana.gov.in" },
        { name: "Himachal Pradesh", url: "https://ceohimachal.nic.in" },
        { name: "Jharkhand", url: "https://ceo.jharkhand.gov.in" },
        { name: "Karnataka", url: "https://ceo.karnataka.gov.in" },
        { name: "Kerala", url: "https://ceo.kerala.gov.in" },
        { name: "Madhya Pradesh", url: "https://ceomadhyapradesh.nic.in" },
        { name: "Maharashtra", url: "https://ceo.maharashtra.gov.in" },
        { name: "Manipur", url: "https://ceomanipur.nic.in" },
        { name: "Meghalaya", url: "https://ceomeghalaya.nic.in" },
        { name: "Mizoram", url: "https://ceomizoram.nic.in" },
        { name: "Nagaland", url: "https://ceonagaland.nic.in" },
        { name: "Odisha", url: "https://ceoodisha.nic.in" },
        { name: "Punjab", url: "https://ceopunjab.nic.in" },
        { name: "Rajasthan", url: "https://ceorajasthan.nic.in" },
        { name: "Sikkim", url: "https://ceosikkim.nic.in" },
        { name: "Tamil Nadu", url: "https://elections.tn.gov.in" },
        { name: "Telangana", url: "https://ceotelangana.nic.in" },
        { name: "Tripura", url: "https://ceotripura.nic.in" },
        { name: "Uttar Pradesh", url: "https://ceouttarpradesh.nic.in" },
        { name: "Uttarakhand", url: "https://ceo.uk.gov.in" },
        { name: "West Bengal", url: "https://ceowestbengal.nic.in" },
        { name: "Andaman & Nicobar", url: "https://ceoandaman.nic.in" },
        { name: "Chandigarh", url: "https://ceochandigarh.gov.in" },
        { name: "Dadra & Nagar Haveli", url: "https://ceodaman.nic.in" },
        { name: "Delhi", url: "https://ceodelhi.gov.in" },
        { name: "Jammu & Kashmir", url: "https://ceojk.nic.in" },
        { name: "Ladakh", url: "https://ceoladakh.nic.in" },
        { name: "Lakshadweep", url: "https://ceolakshadweep.gov.in" },
        { name: "Puducherry", url: "https://ceopuducherry.py.gov.in" }
    ];

    const stateGrid = document.getElementById('state-grid');
    const stateSearch = document.getElementById('state-search');
    const seeMoreBtn = document.getElementById('see-more-btn');

    let showAll = false;
    const INITIAL_LIMIT = 8; // Roughly 2 lines on desktop (4 per line)

    // Function to render state cards
    const renderStates = (filter = "") => {
        stateGrid.innerHTML = "";
        let filteredStates = statesData.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
        
        // Hide button if searching or if already showing all
        if (filter !== "" || showAll || filteredStates.length <= INITIAL_LIMIT) {
            seeMoreBtn.parentElement.style.display = 'none';
        } else {
            seeMoreBtn.parentElement.style.display = 'flex';
            filteredStates = filteredStates.slice(0, INITIAL_LIMIT);
        }

        filteredStates.forEach(state => {
            const card = document.createElement('div');
            card.classList.add('state-card', 'glass-card');
            card.setAttribute('data-state', state.name);
            card.innerHTML = `
                <h3>${state.name}</h3>
                <p>Official Electoral Portal</p>
                <a href="${state.url}" target="_blank" class="state-link">Visit Official Site <i class="fas fa-external-link-alt"></i></a>
            `;
            stateGrid.appendChild(card);
            
            // Re-apply observer to new cards
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = '0.6s ease-out';
            observer.observe(card);
        });
    };

    // Initial render
    renderStates();

    seeMoreBtn.addEventListener('click', () => {
        showAll = true;
        renderStates(stateSearch.value);
    });

    stateSearch.addEventListener('input', (e) => {
        renderStates(e.target.value);
    });

    // Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });

            // Update active link
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        });
    });



    document.querySelectorAll('.feature-card, .timeline-item, .state-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = '0.6s ease-out';
        observer.observe(el);
    });
});
