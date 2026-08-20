(function() {
    var confirmationPageUrl = '/newsletter/confirm-subscription/';
    var activeSubscriberTypes = [
        'regular',
        'premium',
        'gifted',
        'trialed',
        'churning',
        'paused',
        'past_due'
    ];

    function setSubmitting(form, isSubmitting) {
        var button = form.querySelector('button[type="submit"]');
        form.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');

        if (!button) {
            return;
        }

        if (!button.dataset.defaultLabel) {
            button.dataset.defaultLabel = button.textContent;
        }
        button.disabled = isSubmitting;
        button.textContent = isSubmitting ? 'Subscribing…' : button.dataset.defaultLabel;
    }

    function showError(form, message) {
        var status = form.parentElement.querySelector('[data-newsletter-status]');
        if (!status) {
            return;
        }

        status.classList.add('is-error');
        status.textContent = message;
    }

    function appendEmailMessage(element, before, email, after) {
        element.appendChild(document.createTextNode(before));
        var strong = document.createElement('strong');
        strong.textContent = email;
        element.appendChild(strong);
        element.appendChild(document.createTextNode(after));
    }

    function showSuccess(form, email, subscriberType) {
        var container = form.closest('[data-newsletter-signup]');
        if (!container) {
            return;
        }

        var confirmation = document.createElement('div');
        confirmation.className = 'newsletter-confirmation';
        confirmation.setAttribute('role', 'status');
        confirmation.setAttribute('tabindex', '-1');

        var title = document.createElement('h3');
        var message = document.createElement('p');

        if (activeSubscriberTypes.indexOf(subscriberType) !== -1) {
            title.textContent = 'You’re already subscribed';
            appendEmailMessage(message, '', email, ' is already confirmed and subscribed to The Dodo Developer.');
            confirmation.appendChild(title);
            confirmation.appendChild(message);
        } else {
            window.location.assign(confirmationPageUrl);
            return;
        }

        container.replaceChildren(confirmation);
        confirmation.focus();
    }

    function submitNewsletterForm(form) {
        var input = form.querySelector('input[type="email"]');
        var email = input ? input.value.trim() : '';
        var status = form.parentElement.querySelector('[data-newsletter-status]');

        if (!email || !form.reportValidity()) {
            return;
        }

        if (status) {
            status.classList.remove('is-error');
            status.textContent = '';
        }
        setSubmitting(form, true);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        }).then(function(response) {
            return response.json().catch(function() {
                return {};
            }).then(function(payload) {
                if (!response.ok) {
                    throw new Error(payload.error || 'I couldn’t subscribe you just now. Please try again.');
                }
                return payload;
            });
        }).then(function(payload) {
            var subscriberType = payload.data && payload.data.type;
            var unsuccessfulTypes = ['blocked', 'removed', 'unsubscribed', 'undeliverable', 'complained'];

            if (unsuccessfulTypes.indexOf(subscriberType) !== -1) {
                throw new Error('That address couldn’t be subscribed. Please try another email address.');
            }

            showSuccess(form, email, subscriberType);
        }).catch(function(error) {
            setSubmitting(form, false);
            showError(form, error.message || 'I couldn’t subscribe you just now. Please try again.');
        });
    }

    document.querySelectorAll('[data-newsletter-form]').forEach(function(form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            submitNewsletterForm(form);
        });
    });
})();
