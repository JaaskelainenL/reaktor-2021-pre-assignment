import React, { Component, useState } from 'react';
import ReactDOM, { render } from 'react-dom';
import XMLParser from 'react-xml-parser';

import './assets/stylesheets/style.css'

const APIURL = "https://reaktor-2021-backend.herokuapp.com";


// Get the products in a category from the 1st api
const getProducts = async (category) => {
  
    const url = `${APIURL}/products/${category}`

    // CORS
    var myHeaders = new Headers();
    myHeaders.append("Access-Control-Allow-Origin","*")
    var requestOptions = {
      method: 'GET',
      headers: myHeaders
    }
  

  try{  
    const response = await fetch(url, requestOptions);
    if(response.ok){
      return response.json()
    } else {
      return { data :"Error!"};
    }
  }
  // In case of network errors
  catch(error){
    return {data: "Error!"};
  }  
};




// Handles all the products and renders them nicely for the grid.
const Item = (props) => {

  var [stockStatus, setStockStatus] = useState("");
  var [isFetchingStockStatus, setFetchingState] = useState(false);


  // Check for stock on the 2nd API
  const checkForStock = async (retryCount) =>{
      const url = `${APIURL}/availability/${props.data.manufacturer}`

      // CORS
      var myHeaders = new Headers();
      myHeaders.append("Access-Control-Allow-Origin","*")
      var requestOptions = {
        method: 'GET',
        headers: myHeaders
      }

      setFetchingState(true);
      setStockStatus("Checking...");  

      try{

        const response = await fetch(url, myHeaders);

        if(response.ok){
          const data = await response.json();


          // Failure case
          if(data.response == "[]"){
            // ERROR
            // Retry 3 times
            setStockStatus(""); 
            if(retryCount<3){
              checkForStock(retryCount+1);

            } else{
              alert("Error fetching "+props.data.name+"! \nTry again later.");
              setStockStatus(""); 
            }

          } else{

            // Search for ID match and return the matching availability

            let id = props.data.id.toUpperCase(); // ID is uppercase in the availability API unlike in the products API
            
            for(let i=0; i<data.response.length;i++){
              
              if(id==data.response[i].id){
              
                var jsonData = new XMLParser().parseFromString(data.response[i].DATAPAYLOAD);

                let status;
                switch(jsonData.children[1].value){
                  case "INSTOCK": status = "In Stock"; break;
                  case "OUTOFSTOCK": status = "Out Of Stock"; break;
                  case "LESSTHAN10": status = "Less Than 10"; break;
                  default: status = jsonData.children[1].value; break;
                }
                setStockStatus(status);
                break;
              }
            }
          }
          setFetchingState(false);
        }

        else{
          alert("Error connecting!");
          setStockStatus("");
          setFetchingState(false);
        }

        // In case of network errors
      } catch(error){
        alert("Error connecting!");
        setStockStatus("");
        setFetchingState(false);          
      }
  }


  return(
  <div id="item"> 
    <h1>Name: {props.data.name} </h1>
    <h2>Manufacturer: {props.data.manufacturer} </h2>
    <h2>Price: ${props.data.price}</h2>
    <h2>Colors:{[...Array(props.data.color.length).keys()].map(item => (
    <li key={item}>{props.data.color[item]}</li>))}
    </h2>
    <center>
    <button disabled={isFetchingStockStatus} onClick={() => checkForStock(0)}>{stockStatus == false ? "Check for availability": stockStatus}</button>
    </center>
    <h3>Id: {props.data.id} </h3>
  </div>
  )

}

// Main class.
// Handles all objects and their rendering.
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      products: [],
      category: "gloves",
    }; 
  }

  async componentDidMount(){
    const response = await getProducts(this.state.category);
    this.setState({products:response});

  }

  async switchCategory(c){
    await this.setState({products: [], category: c});
    await this.componentDidMount();
  }

  render() {
    let product = [];

    // Check if connection to the API is fine
    if(this.state.products.data == "Error!"){
        product = <div><h1>No connection! :(</h1></div>
    
    } else {

        if(this.state.products.length>0){

          // Push the results in a list
          for(let i=0;i<this.state.products.length;i++){
            product.push(<Item data={this.state.products[i]}/>)
          }

        }
        else {
          product = <div><h1>Loading...</h1></div>
        }

    }
    
    
    return (
      <div>
      <center>
        <button id={this.state.category == "gloves" ? "navButton-activated" : "navButton"} onClick={() => this.switchCategory("gloves")}>Gloves</button>
        <button id={this.state.category == "facemasks" ? "navButton-activated" : "navButton"} onClick={() => this.switchCategory("facemasks")}>Facemasks</button>
        <button id={this.state.category == "beanies" ? "navButton-activated" : "navButton"} onClick={() => this.switchCategory("beanies")}>Beanies</button>        
      </center>
        <div id="grid">
          {product}
        </div>
      </div>
      
      
    );
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('root')
);
