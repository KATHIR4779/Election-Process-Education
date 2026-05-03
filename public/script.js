/**
 * @file script.js
 * @description Master logic for BharatVoter UI.
 * Implements accessibility, sanitization, and state management.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Selectors
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const stateGrid = document.getElementById('state-grid');
    const stateSearch = document.getElementById('state-search');
    const seeMoreBtn = document.getElementById('see-more-btn');
    
    let chatHistory = [];
    let showAll = false;
    const INITIAL_LIMIT = 8;

    /**
     * ACCESSIBILITY: Focus Management
     * Ensures screen readers are notified of new AI content.
     */
    const announceToScreenReader = (text) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.classList.add('sr-only');
        announcement.innerText = `New message: ${text}`;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    };

    /**
     * SECURITY: Frontend Sanitization
     * Uses DOMPurify to prevent XSS from AI responses.
     */
    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.setAttribute('role', 'listitem');
        
        // Clean markdown-style formatting
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/^\* (.*)/gm, '<li>$1</li>');
        
        // Final Security Layer: DOMPurify
        if (window.DOMPurify) {
            formattedText = DOMPurify.sanitize(formattedText);
        }
        
        messageDiv.innerHTML = formattedText;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (sender === 'system') announceToScreenReader(text);
    };

    /**
     * BUSINESS LOGIC: Chat Handler
     */
    const handleChat = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        userInput.value = '';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'system');
        loadingDiv.innerHTML = '<em>Consulting ECI Guidelines...</em>';
        chatMessages.appendChild(loadingDiv);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: chatHistory })
            });

            const data = await response.json();
            chatMessages.removeChild(loadingDiv);

            if (data.error) {
                addMessage(`Status: ${data.error}`, 'system');
            } else {
                addMessage(data.response, 'system');
                chatHistory.push({ role: 'user', parts: [{ text: message }] });
                chatHistory.push({ role: 'model', parts: [{ text: data.response }] });
            }
        } catch (error) {
            if (chatMessages.contains(loadingDiv)) chatMessages.removeChild(loadingDiv);
            addMessage("Network Error: Please verify your internet connection.", 'system');
        }
    };

    // State Data Definitions
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

    /**
     * UI: State Card Renderer
     */
    const renderStates = (filter = "") => {
        stateGrid.innerHTML = "";
        let filtered = statesData.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
        
        if (filter !== "" || showAll || filtered.length <= INITIAL_LIMIT) {
            seeMoreBtn.parentElement.style.display = 'none';
        } else {
            seeMoreBtn.parentElement.style.display = 'flex';
            filtered = filtered.slice(0, INITIAL_LIMIT);
        }

        filtered.forEach(state => {
            const card = document.createElement('div');
            card.classList.add('state-card', 'glass-card');
            card.innerHTML = `
                <h3>${state.name}</h3>
                <p>Electoral Portal</p>
                <a href="${state.url}" target="_blank" class="state-link" aria-label="Visit ${state.name} official site">Portal Access <i class="fas fa-external-link-alt"></i></a>
            `;
            stateGrid.appendChild(card);
        });
    };

    // Event Bindings
    sendBtn.addEventListener('click', handleChat);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });
    seeMoreBtn.addEventListener('click', () => { showAll = true; renderStates(stateSearch.value); });
    stateSearch.addEventListener('input', (e) => renderStates(e.target.value));

    // Initial Load
    renderStates();
});
