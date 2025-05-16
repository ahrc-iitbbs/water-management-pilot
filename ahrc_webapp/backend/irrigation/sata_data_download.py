#Auto download satellite data from NASA site
# Download data only for 6-9 hour window for that last available data
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from datetime import datetime, timedelta

# overriding requests.Session.rebuild_auth to mantain headers when redirected
class SessionWithHeaderRedirection(requests.Session):
    AUTH_HOST = 'urs.earthdata.nasa.gov'

    def __init__(self, username, password):
        super().__init__()
        self.auth = (username, password)

   # Overrides from the library to keep headers when redirected to or from the NASA auth host.

    def rebuild_auth(self, prepared_request, response):
        headers = prepared_request.headers
        url = prepared_request.url

        if 'Authorization' in headers:
            original_parsed = requests.utils.urlparse(response.request.url)
            redirect_parsed = requests.utils.urlparse(url)

            if (original_parsed.hostname != redirect_parsed.hostname and  
                redirect_parsed.hostname != self.AUTH_HOST and 
                original_parsed.hostname != self.AUTH_HOST):
                del headers['Authorization']
        return

def get_h5_file_link(url, specific_file_name_pattern = 'T090000', retry_count=3):

    h5_link = ''

    # Retry logic
    for attempt in range(retry_count):
        try:
            # Send HTTP GET request
            response = requests.get(url)
            response.raise_for_status()  # Raise exception for HTTP errors           
        except requests.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt == retry_count - 1:
                return ''  # Return empty list after all retries
            
        # If we reach here, the request was successful
        try:
            # Parse the HTML content
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find all <a> tags with href attributes
            links = soup.find_all('a', href=True)

            # Filter links that end with .h5 and join with base URL if relative
            for link in links:
                href = link['href']
                if href.endswith('.h5') and specific_file_name_pattern in href:
                    full_url = urljoin(url, href)
                    h5_link = full_url

            return h5_link
        except requests.RequestException as e:
            print(f"Error fetching URL: {e}")
            return ''
    
def get_lastest_data_file_available(data_folder_url_base, retry_count=3):
    data_file_link = ''
    #Look back for last 10 days starting today. Break if you find a folder with required data file.
    for i in range(10):
        # Get year, month and day of today
     
        current_date = datetime.now() - timedelta(days=i)
        year = current_date.year
        month = current_date.month
        day = current_date.day

        data_folder_url = data_folder_url_base + f'/{year}/{month}/{day}'
        data_file_link = get_h5_file_link(data_folder_url)
        if (data_file_link):
            print(f"Data available for {year}-{month:02d}-{day:02d}") 
            break
    return data_file_link

def main():

    # URL for the login page
    LOGIN_URL = "https://urs.earthdata.nasa.gov/"
 
    # Your login credentials
    username = "iitbbssj13"
    password = "Groundwater@89"

    # create session with the user credentials that will be used to authenticate access to the data
    session = SessionWithHeaderRedirection(username, password)
    
    DATA_FOLDER_URL_BASE = "https://cmr.earthdata.nasa.gov/virtual-directory/collections/C2938665508-NSIDC_CPRD/temporal"
    
    data_file_url =  get_lastest_data_file_available(DATA_FOLDER_URL_BASE)
    
    #Create output directory if it doesn't exist.
    H5_FILE_DIR = "./smap_files"
    os.makedirs(H5_FILE_DIR, exist_ok=True)

    # extract the filename from the url to be used when saving the file
    data_filename = data_file_url[data_file_url.rfind('/')+1:]  

    print(f"Dowloading {data_filename} ...")
    try:
        # submit the request using the session
        response = session.get(data_file_url, stream=True)
        # print(response.status_code)

        # raise an exception in case of http errors
        response.raise_for_status()  

        # save the file
        with open(H5_FILE_DIR + '/' + data_filename, 'wb') as fd:
            for chunk in response.iter_content(chunk_size=1024*1024):
                fd.write(chunk)

    except requests.exceptions.HTTPError as e:
        print(e)

if __name__ == "__main__":
    main()
