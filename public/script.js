document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    let chatHistory = [];

    const formatMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*)/gm, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    };

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.innerHTML = formatMarkdown(text);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    };

    const handleChat = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        userInput.value = '';
        
        const loadingDiv = addMessage('<em>Thinking...</em>', 'system');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: chatHistory })
            });

            const data = await response.json();
            chatMessages.removeChild(loadingDiv);

            if (data.error) {
                addMessage(`Error: ${data.error}`, 'system');
            } else {
                addMessage(data.response, 'system');
                chatHistory.push({ role: 'user', parts: [{ text: message }] });
                chatHistory.push({ role: 'model', parts: [{ text: data.response }] });
            }
        } catch (error) {
            chatMessages.removeChild(loadingDiv);
            addMessage("Unable to connect to the server. Please check your internet connection.", 'system');
        }
    };

    sendBtn.addEventListener('click', handleChat);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    // --- State Directory Logic ---
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
    const INITIAL_LIMIT = 8;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    const renderStates = (filter = "") => {
        stateGrid.innerHTML = "";
        let filteredStates = statesData.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
        
        if (filter !== "" || showAll || filteredStates.length <= INITIAL_LIMIT) {
            seeMoreBtn.parentElement.style.display = 'none';
        } else {
            seeMoreBtn.parentElement.style.display = 'flex';
            filteredStates = filteredStates.slice(0, INITIAL_LIMIT);
        }

        filteredStates.forEach(state => {
            const card = document.createElement('div');
            card.classList.add('state-card', 'glass-card');
            card.innerHTML = `
                <h3>${state.name}</h3>
                <p>Official Electoral Portal</p>
                <a href="${state.url}" target="_blank" class="state-link">Visit Official Site <i class="fas fa-external-link-alt"></i></a>
            `;
            stateGrid.appendChild(card);
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = '0.6s ease-out';
            observer.observe(card);
        });
    };

    renderStates();
    stateSearch.addEventListener('input', (e) => renderStates(e.target.value));
    seeMoreBtn.addEventListener('click', () => {
        showAll = true;
        renderStates(stateSearch.value);
    });
});
