public with sharing class ContactManager {
    @AuraEnabled
    public static List<Object> getContacts(String sorting, Integer resultsPerPage, Integer currentPage){
        if(resultsPerPage == null){
            resultsPerPage = 5;
        }
        if(currentPage == null){
            currentPage = 1;
        }
        Integer offset = (currentPage - 1)*resultsPerPage;
        String limitClause = 'LIMIT '+resultsPerPage+' OFFSET '+offset;
        
        String sortingClause = '';
        if(sorting != null){
            sortingClause = 'ORDER BY Name ';
            sorting = sorting == 'nameAsc' ? 'ASC ' : 'DESC ';
            sortingClause = sortingClause + sorting;
        }
        
        String dynamicQuery = 'SELECT Name, Email, Phone FROM Contact WITH SECURITY_ENFORCED '+sortingClause+limitClause;
        try {
        	return database.query(dynamicQuery);
        } catch(System.QueryException qe) {
            Schema.DescribeSObjectResult contactDescribe = Contact.sObjectType.getDescribe();
            if(!contactDescribe.accessible){
                String m = 'Insufficient permissions: secure query included inaccessible object';
                qe.setMessage(m);
            }
            return new List<Map<String, String>>{new Map<String, String>{'error' => qe.getMessage()}};
        }
    }
    
    @AuraEnabled
    public static Integer getAmountOfContacts(){
        List<AggregateResult> result = [SELECT COUNT(Id) total FROM Contact];
        return (Integer)result[0].get('total');
    }
}