describe('Google Meet Clone - Meeting Flow', () => {
    beforeEach(() => {
        // Navigate to the front page
        cy.visit('/');
    });

    it('should display the home page correctly', () => {
        cy.contains('Google Meet Clone');
        cy.contains('Premium video meetings');
        cy.contains('New meeting');
        cy.get('input[placeholder="Enter a code or link"]').should('exist');
    });

    it('should generate a new meeting room id and navigate to it when clicking New Meeting', () => {
        cy.contains('New meeting').click();

        // Check if the URL changed to /room/:id
        cy.url().should('include', '/room/');

        // Verify that the Meeting Room UI renders
        cy.get('.meeting-page').should('exist');
        cy.get('.video-grid').should('exist');
        cy.contains('Meeting ID:');

        // Check if local video element is rendered
        cy.get('video.my-video').should('exist');
    });

    it('should join a specific meeting room when entering a code', () => {
        const testRoomId = 'test-room-123';

        // Type the room ID into the input field
        cy.get('input[placeholder="Enter a code or link"]').type(testRoomId);

        // Click join
        cy.contains('Join').click();

        // Check we navigated correctly
        cy.url().should('include', `/room/${testRoomId}`);

        // Wait for Meeting Room to render
        cy.get('.meeting-page').should('exist');
        cy.contains(`Meeting ID: ${testRoomId}`);
    });
});
