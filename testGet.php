<?php
	try {
		$ip = $_GET;
		$url = 'http://localhost:8000';

		$response = file_get_contents($url);
		if ($response != false) {
			echo $response;
		}

	} catch (Exception $e) {
		echo $e->getMessage();
	}

	try {
		$history_data = file_get_contents('./query_history_data.txt');
		$history_structure = file_get_contents('./query_history_structure.txt');


		$data = array("data" => $history_data, "query_structure" => $history_structure, "query_id" => 1);
		$data_string = json_encode($data);
		$ch = curl_init('http://localhost:8000/addserver');                                                                      
	    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
	    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);                                                                  
	    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);                                                                      
	    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
	        'Content-Type: application/json',                                                                                
	        'Content-Length: ' . strlen($data_string))                                                                 
	    );
	    curl_exec($ch);

	    echo "Hello!!";

	} catch (Exception $e) {
		echo $e->getMessage();
	}
?>