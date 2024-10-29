import pyodbc
import pandas as pd

# Database connection parameters
server = 'tcp:tenchq.database.windows.net'  # Replace with your server address
database = 'PJ_DB'  # Replace with your database name
username = 'Tenchq'  # Replace with your username
password = 'T10.Thepthat'  # Replace with your password

# Create a connection string
connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;'

# Connect to the database
connection = pyodbc.connect(connection_string)
cursor = connection.cursor()

# SQL insert query
main_query = '''
INSERT INTO covid_data (date, total) VALUES
'''

# Data to insert
data_to_insert = ()


# def insertData():
#     query = main_query
#     df = pd.read_csv('normalized.csv')
#     for i in range()

# Execute the insert query
cursor.execute(insert_query, data_to_insert)

# Commit the transaction
connection.commit()

# Close the cursor and connection
cursor.close()
connection.close()

print("Data inserted successfully.")
