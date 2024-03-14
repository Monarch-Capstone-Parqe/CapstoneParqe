from sqlalchemy import create_engine, MetaData, text
import config.variables as variables

# Create engine and metadata
engine = create_engine(f'postgresql://{variables.DB_USERNAME}:{variables.DB_PASSWORD}@localhost:5432/parqe')
metadata = MetaData()
metadata.reflect(bind=engine)

def drop_all_tables():
    with engine.connect() as conn:
        # Get table names
        table_names = metadata.tables.keys()

        # Drop each table
        for table_name in table_names:
            conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))

    print("All tables dropped successfully.")

if __name__ == "__main__":
    drop_all_tables()