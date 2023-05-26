import { LightningElement } from 'lwc';
import getContacts from '@salesforce/apex/ContactManager.getContacts';
import getAmountOfContacts from '@salesforce/apex/ContactManager.getAmountOfContacts';
import myModal from 'c/myModal';

const columns = [
    { label: '', fieldName: 'RowNumber', initialWidth: 5, hideDefaultActions: true, editable: false },
    { label: 'Name', fieldName: 'Name', editable: false },
    { label: 'Email', fieldName: 'Email', type: 'email', editable: false},
    { label: 'Phone', fieldName: 'Phone', type:'phone', editable: false},
];

export default class ContactList extends LightningElement {
    data = [];
    columns = columns;
    sortValue;
    loading;
    error;
    currentPage;
    totalPages;
    resultsPerPage;

    resultsPerPageOptions = [
        { label: '5', value: '5' },
        { label: '10', value: '10' },
        { label: '30', value: '30' },
    ];

    sortOptions = [
        { label: 'Name A-Z', value: 'nameAsc' },
        { label: 'Name Z-A', value: 'nameDesc' },
    ];

    /**
     * Life cycle hook, initalizes the component. Sets the current page and results per page to default.
     */
    connectedCallback(){
        this.getAmountOfContacts();
        this.getContacts();
        this.currentPage = 1;
        this.resultsPerPage = 5;
    }

    /**
     * Retrieves the total amount of contacts the user is able to access via Apex.
     */
    getAmountOfContacts = () => {
        getAmountOfContacts({})
        .then(
            (result) => {
                this.totalResults = result;
                this.calculateTotalPages();
            })
        .catch(error => {
                console.log(error);
            });
    }

    /**
     * Retrieves the contact records according to pagination and sorting variables. It triggers
     * error modal opening when encountering an error.
     */
    getContacts = () => {
        this.data = [];
        this.loading = true;
        getContacts({
                        sorting: this.sortValue === undefined ? null : this.sortValue,
                        currentPage: this.currentPage,
                        resultsPerPage: this.resultsPerPage
                    })
            .then(
                (result) => {
                    if(result.length === 1 && 'error' in result[0]){
                        this.error = result[0].error;
                        this.handleShowModal();
                    } else {
                        let i = 1;
                        result.forEach((contact) => {
                            contact['RowNumber'] = this.resultsPerPage*(this.currentPage-1)+i;
                            i++;
                        });
                        this.data = result;
                    }
                    this.loading = false;
                })
            .catch(error => {
                    console.log(error);
                });
    }

    /**
     * Sets the sorting variable and refreshes
     * @param {DOM Event} event - Contains information about lightning combobox element.
     */
    handleSortChange = (event) => {
        this.sortValue = event.detail.value;
        this.getContacts();
    }

    /**
     * Sets the results per page variable and refreshes contacts.
     * @param {DOM Event} event - Contains information about lightning combobox element.
     */
    handleResultsPerPageChange = (event) => {
        this.resultsPerPage = event.detail.value;
        this.calculateTotalPages();
        this.getContacts();
    }

    /**
     * Increments the current page and controls pagination button enabling.
     */
    handlePageRight = () => {
        this.currentPage++;
        this.getContacts();
        this.controlPaginationButton('enable', 'left');
        if(this.currentPage === this.totalPages){
            this.controlPaginationButton('disable', 'right');
        }
    }

    /**
     * Decrements the current page and controls pagination button enabling.
     */
    handlePageLeft = () => {
        this.currentPage--;
        this.getContacts();
        this.controlPaginationButton('enable', 'right');
        if(this.currentPage === 1){
            this.controlPaginationButton('disable', 'left');
        }
    }

    /**
     * Enables or disables the increase or decrease page buttons from pagination according to parameters.
     * @param {String} enableOrDisable - whether to enable or disable the specified button.
     * @param {String} leftOrRight - whether the button to control should be increase or decrease page.
     */
    controlPaginationButton = (enableOrDisable, leftOrRight) => {
        let button;
        if(leftOrRight === 'left'){
            button = this.template.querySelector('[data-id=left-button]');
        } else {
            button = this.template.querySelector('[data-id=right-button]');
        }
        if(enableOrDisable === 'enable'){
            button.classList.remove('disabled-button');
        } else {
            button.classList.add('disabled-button');
        }
    }

    /**
     * Calculates total number of pages and enables or disables pagination buttons accordingly.
     * Whenever this is triggered, the user is taken to the first result page.
     */
    calculateTotalPages = () => {
        this.totalPages = Math.floor(this.totalResults/this.resultsPerPage);
        this.totalPages = this.totalPages === 0 ? 1 : this.totalPages;
        this.currentPage = 1;
        if(this.totalPages === 1){
            this.controlPaginationButton('disable', 'left');
            this.controlPaginationButton('disable', 'right');
        } else {
            this.controlPaginationButton('enable', 'right');
        }
    }

    /**
     * Calls the open method from the myModal component to display an error message.
     */
    async handleShowModal(){
        myModal.open({
            size: 'small',
            content: this.error,
            description: 'Error modal'
        })
    }
}