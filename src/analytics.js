import { supabase } from './services/supabase.js';

// Mock Analytics Service for MVP Validation
export function trackEvent(eventName, eventData = {}) {
  // En producción esto enviaría los datos a Google Analytics, Mixpanel, etc.
  console.log(`[Analytics Event] ${eventName}`, eventData);
}

// Generar o recuperar session_id persistente anónimo
function getSessionId() {
  let sessionId = localStorage.getItem('gear_session_id');
  if (!sessionId) {
    // Generar un UUID simple (o fallback)
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('gear_session_id', sessionId);
  }
  return sessionId;
}

// Inicialización de lógica UI de la Landing Page
document.addEventListener('DOMContentLoaded', () => {
  // Feedback UI Logic
  const btnYes = document.getElementById('btn-feedback-yes');
  const btnNo = document.getElementById('btn-feedback-no');
  const feedbackForm = document.getElementById('feedback-form');
  const btnSubmit = document.getElementById('btn-submit-feedback');
  const feedbackSuccess = document.getElementById('feedback-success');
  const feedbackActions = document.getElementById('feedback-actions');
  const feedbackQuestion = document.getElementById('feedback-question');
  
  // Form fields
  const feedbackText = document.getElementById('feedback-text');
  const feedbackRole = document.getElementById('feedback-role');
  const feedbackEmail = document.getElementById('feedback-email');
  const feedbackError = document.getElementById('feedback-error');

  let feedbackType = null;

  if (btnYes && btnNo) {
    btnYes.addEventListener('click', () => {
      feedbackType = 'positive';
      trackEvent('feedback_started', { type: feedbackType });
      feedbackActions.style.display = 'none';
      feedbackQuestion.textContent = 'Awesome! What did you like the most?';
      feedbackForm.style.display = 'block';
    });

    btnNo.addEventListener('click', () => {
      feedbackType = 'negative';
      trackEvent('feedback_started', { type: feedbackType });
      feedbackActions.style.display = 'none';
      feedbackQuestion.textContent = 'Sorry to hear that. What were you trying to achieve?';
      feedbackForm.style.display = 'block';
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      const text = feedbackText.value.trim();
      
      // Basic validation
      if (!text) {
        feedbackError.textContent = 'Please provide some details before submitting.';
        feedbackError.style.display = 'block';
        return;
      }
      
      if (text.length > 2000) {
        feedbackError.textContent = 'Message is too long. Please keep it under 2000 characters.';
        feedbackError.style.display = 'block';
        return;
      }

      feedbackError.style.display = 'none';
      
      // Submitting state
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = 'Sending...';
      btnSubmit.disabled = true;

      try {
        if (supabase) {
          const { error } = await supabase
            .from('Feedback')
            .insert([
              {
                type: feedbackType,
                message: text,
                user_role: feedbackRole ? feedbackRole.value : null,
                email: feedbackEmail && feedbackEmail.value.trim() !== '' ? feedbackEmail.value.trim() : null,
                page: window.location.pathname,
                session_id: getSessionId()
                // status, created_at, id utilizan defaults en Supabase
              }
            ]);

          if (error) {
            throw error;
          }
        } else {
          console.warn('Supabase no está inicializado. Faltan variables de entorno.');
          // Para desarrollo local si no hay variables configuradas, podríamos simular el delay.
          await new Promise(r => setTimeout(r, 800));
        }

        // Track submission only if it successfully saved
        trackEvent('feedback_submitted', { type: feedbackType, role: feedbackRole ? feedbackRole.value : null });
        
        // Success state
        feedbackForm.style.display = 'none';
        feedbackQuestion.style.display = 'none';
        feedbackSuccess.style.display = 'block';
      } catch (err) {
        console.error('Error submitting feedback:', err);
        // Error state: no se muestran detalles internos
        feedbackError.textContent = 'Could not send feedback. Please try again.';
        feedbackError.style.display = 'block';
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }
});
