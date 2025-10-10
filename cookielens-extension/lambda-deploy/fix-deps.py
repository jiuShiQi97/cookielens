#!/usr/bin/env python3
"""
Create a complete Lambda deployment package with all dependencies
"""

import os
import subprocess
import zipfile
import shutil

def install_dependencies():
    """Install Python dependencies locally"""
    print("📦 Installing Python dependencies...")
    
    # Create a temporary directory for dependencies
    deps_dir = "lambda_deps"
    if os.path.exists(deps_dir):
        shutil.rmtree(deps_dir)
    os.makedirs(deps_dir)
    
    try:
        # Install dependencies
        subprocess.run([
            "pip3", "install", 
            "-r", "requirements.txt", 
            "-t", deps_dir
        ], check=True)
        
        print("✅ Dependencies installed successfully")
        return deps_dir
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return None

def create_deployment_package():
    """Create deployment package with all files"""
    print("📦 Creating deployment package...")
    
    # Install dependencies
    deps_dir = install_dependencies()
    if not deps_dir:
        return None
    
    # Create zip file
    zip_filename = "cookielens-lambda-complete.zip"
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add main function
        if os.path.exists('lambda_function.py'):
            zipf.write('lambda_function.py')
            print("  ✅ Added lambda_function.py")
        
        # Add all dependencies
        for root, dirs, files in os.walk(deps_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, deps_dir)
                zipf.write(file_path, arc_path)
        print(f"  ✅ Added dependencies from {deps_dir}")
    
    # Clean up
    shutil.rmtree(deps_dir)
    
    print(f"✅ Deployment package created: {zip_filename}")
    return zip_filename

def update_lambda_function(zip_filename):
    """Update Lambda function with new package"""
    print("🚀 Updating Lambda function...")
    
    try:
        import boto3
        
        lambda_client = boto3.client('lambda')
        
        # Read zip file
        with open(zip_filename, 'rb') as f:
            zip_content = f.read()
        
        # Update function code
        response = lambda_client.update_function_code(
            FunctionName='cookielens-scanner',
            ZipFile=zip_content
        )
        
        print(f"✅ Lambda function updated: {response['FunctionArn']}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update Lambda function: {e}")
        return False

def main():
    """Main function"""
    print("🔧 Creating complete Lambda deployment package...")
    
    # Create deployment package
    zip_filename = create_deployment_package()
    if not zip_filename:
        print("❌ Failed to create deployment package")
        return
    
    # Update Lambda function
    success = update_lambda_function(zip_filename)
    if success:
        print("\n✅ Lambda function updated successfully!")
        print("🧪 You can now test the function again.")
    else:
        print("\n❌ Failed to update Lambda function")
    
    # Clean up
    if os.path.exists(zip_filename):
        os.remove(zip_filename)
        print("🧹 Cleaned up deployment package")

if __name__ == "__main__":
    main()
