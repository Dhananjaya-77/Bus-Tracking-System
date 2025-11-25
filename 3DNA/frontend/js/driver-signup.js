/**
 * Driver Sign-Up Form Handler
 * Handles form validation, submission, and account creation
 */

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const successMessage = document.getElementById('successMessage');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearAllErrors();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Collect form data
        const formData = new FormData(signupForm);
        const data = {
            full_name: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            license_number: formData.get('license'),
            password: formData.get('password'),
            user_type: 'driver'
        };

        // Disable submit button
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch('../../backend/api/auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // Try to parse JSON only if server returned JSON
            let result = null;
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
                try {
                    result = await response.json();
                } catch (e) {
                    // Invalid JSON
                    throw new Error('Invalid JSON response from server');
                }
            } else {
                const text = await response.text();
                throw new Error('Unexpected response from server: ' + text);
            }

            if (result && result.success) {
                // Show success message
                successMessage.style.display = 'block';
                signupForm.style.display = 'none';

                // Store registration data temporarily
                localStorage.setItem('last_registered_email', data.email);

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'driver-login.html';
                }, 2000);
            } else {
                // Handle specific error messages
                const serverMessage = (result && result.message) ? result.message : 'Registration failed';
                if (serverMessage.toLowerCase().includes('email')) {
                    showError('emailError', serverMessage);
                } else if (serverMessage.toLowerCase().includes('phone')) {
                    showError('phoneError', serverMessage);
                } else if (serverMessage.toLowerCase().includes('license')) {
                    showError('licenseError', serverMessage);
                } else {
                    alert('Registration failed: ' + serverMessage);
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        } catch (error) {
            console.error('Sign-up error:', error);
            // Show the actual error message to help debugging (safe in dev)
            alert('An error occurred during registration: ' + (error.message || 'Please try again.'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });

    /**
     * Validate all form fields
     */
    function validateForm() {
        let isValid = true;

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const license = document.getElementById('license').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;

        // Validate Full Name
        if (!fullName || fullName.length < 3) {
            showError('fullNameError', 'Full name must be at least 3 characters');
            isValid = false;
        }

        // Validate Email
        if (!email || !isValidEmail(email)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        // Validate Phone
        if (!phone || !isValidPhone(phone)) {
            showError('phoneError', 'Please enter a valid phone number');
            isValid = false;
        }

        // Validate License Number
        if (!license || license.length < 5) {
            showError('licenseError', 'License number must be at least 5 characters');
            isValid = false;
        }

        // Validate Password
        if (!password || password.length < 6) {
            showError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        } else if (!isStrongPassword(password)) {
            showError('passwordError', 'Password must contain uppercase and numbers');
            isValid = false;
        }

        // Validate Password Match
        if (password !== confirmPassword) {
            showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }

        // Validate Terms
        if (!terms) {
            showError('termsError', 'You must agree to the terms and conditions');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone format
     */
    function isValidPhone(phone) {
        const phoneRegex = /^[\d\-\+\(\)\s]{10,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Check password strength
     */
    function isStrongPassword(password) {
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        return hasUppercase && hasNumbers;
    }

    /**
     * Show error message
     */
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Clear all error messages
     */
    function clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

    // Real-time validation on input blur
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this.id);
        });
    });

    /**
     * Validate individual field
     */
    function validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElementId = fieldId + 'Error';
        const errorElement = document.getElementById(errorElementId);

        if (!errorElement) return;

        switch (fieldId) {
            case 'fullName':
                if (field.value.trim().length < 3) {
                    showError(errorElementId, 'Name must be at least 3 characters');
                } else {
                    errorElement.style.display = 'none';
                }
                break;

            case 'email':
                if (!isValidEmail(field.value.trim())) {
                    showError(errorElementId, 'Invalid email format');
                } else {
                    errorElement.style.display = 'none';
                }
                break;

            case 'phone':
                if (!isValidPhone(field.value.trim())) {
                    showError(errorElementId, 'Invalid phone number');
                } else {
                    errorElement.style.display = 'none';
                }
                break;

            case 'license':
                if (field.value.trim().length < 5) {
                    showError(errorElementId, 'License number too short');
                } else {
                    errorElement.style.display = 'none';
                }
                break;

            case 'password':
                if (field.value.length < 6) {
                    showError(errorElementId, 'Password too short');
                } else if (!isStrongPassword(field.value)) {
                    showError(errorElementId, 'Must contain uppercase and numbers');
                } else {
                    errorElement.style.display = 'none';
                }
                break;

            case 'confirmPassword':
                const password = document.getElementById('password').value;
                if (field.value !== password) {
                    showError(errorElementId, 'Passwords do not match');
                } else {
                    errorElement.style.display = 'none';
                }
                break;
        }
    }
});
