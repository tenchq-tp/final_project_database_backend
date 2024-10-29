import pandas as pd
import pyodbc

file_path = 'normalized.csv'

file = open(file_path, 'r')
data = file.readlines(-1)[1::]

server = 'tcp:tenchq.database.windows.net'  # Replace with your server address
database = 'PJ_DB'  # Replace with your database name
username = 'Tenchq'  # Replace with your username
password = 'T10.Thepthat'  # Replace with your password

connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;'

# Connect to the database
connection = pyodbc.connect(connection_string)
cursor = connection.cursor()

main_query = 'INSERT INTO covid_data (date, total) VALUES \n'
i = 0
query = 'INSERT INTO covid_data (date, total) VALUES \n'
for d in data:
    index, date, total = d.split(',')
    total = total[:-1]
    query += f"('{date}', {total}), \n"
    # print(query)
    if i == 500:
        query = 'INSERT INTO covid_data (date, total) VALUES \n'
        
    if (i == 1000):
        print(query)
        query = 'INSERT INTO covid_data (date, total) VALUES \n'
    i += 1    
print(query)
query = 'INSERT INTO covid_data (date, total) VALUES \n'
query = query[:-2]
cursor.execute(query)
connection.commit()