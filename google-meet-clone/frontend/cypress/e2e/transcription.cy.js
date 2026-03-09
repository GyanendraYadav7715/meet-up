describe('Real-time Transcription and Live Captions', () => {
    beforeEach(() => {
        // Visit the home page to start a new meeting
        cy.visit('http://localhost:3000');

        // We stub the Web Speech API on the window object before the application loads
        cy.window().then((win) => {
            // Create a mock SpeechRecognition class
            class MockSpeechRecognition {
                constructor() {
                    this.continuous = false;
                    this.interimResults = false;
                    this.lang = 'en-US';
                    this.onresult = null;
                    this.onerror = null;
                    this.onend = null;
                }

                start() {
                    // Simulate speech recognition capturing text after 1 second
                    setTimeout(() => {
                        if (this.onresult) {
                            const mockEvent = {
                                resultIndex: 0,
                                results: [
                                    [{ transcript: 'Hello everyone, welcome to the meeting.' }]
                                ]
                            };
                            // Add a mock isFinal property
                            mockEvent.results[0].isFinal = true;

                            this.onresult(mockEvent);
                        }
                        if (this.onend) {
                            this.onend();
                        }
                    }, 1000);
                }

                stop() {
                    if (this.onend) this.onend();
                }
            }

            // Inject the mock
            win.SpeechRecognition = MockSpeechRecognition;
            win.webkitSpeechRecognition = MockSpeechRecognition;
        });
    });

    it('should toggle CC, display live captions, and export notes', () => {
        // 1. Join a meeting (assuming the UI has a 'Start Meeting' button)
        cy.contains('Start Meeting').click();

        // 2. Wait for meeting room to load and initialize (wait for CC button)
        cy.get('button[title="Toggle CC"]').should('be.visible').click();

        // 3. The mock SpeechRecognition will fire automatically. We verify the overlay appears
        cy.get('.captions-overlay').should('contain', 'Hello everyone, welcome to the meeting.');

        // 4. Verify Export button appears after a final caption is received
        cy.get('button[title="Export Captions to MongoDB"]').should('be.visible');

        // 5. Click the export button 
        cy.get('button[title="Export Captions to MongoDB"]').click();

        // We verify the window alert for successful export
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Meeting notes exported to MongoDB successfully!');
        });
    });
});
