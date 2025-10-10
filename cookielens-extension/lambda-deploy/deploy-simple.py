#!/usr/bin/env python3
"""
Deploy simplified CookieLens Lambda function (without Playwright)
"""

import os
import subprocess
import zipfile
import shutil
import boto3

def create_simple_deployment_package():
    """Create deployment package with simplified dependencies"""
    print("📦 Creating simplified deployment package...")
    
    # Create a temporary directory for dependencies
    deps_dir = "lambda_deps_simple"
    if os.path.exists(deps_dir):
        shutil.rmtree(deps_dir)
    os.makedirs(deps_dir)
    
    try:
        # Install simplified dependencies
        subprocess.run([
            "pip3", "install", 
            "-r", "requirements_simple.txt", 
            "-t", deps_dir
        ], check=True)
        
        print("✅ Simplified dependencies installed successfully")
        
        # Create zip file
        zip_filename = "cookielens-lambda-simple.zip"
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add main function
            if os.path.exists('lambda_function_simple.py'):
                zipf.write('lambda_function_simple.py', 'lambda_function.py')
                print("  ✅ Added lambda_function_simple.py as lambda_function.py")
            
            # Add all dependencies
            for root, dirs, files in os.walk(deps_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arc_path = os.path.relpath(file_path, deps_dir)
                    zipf.write(file_path, arc_path)
            print(f"  ✅ Added dependencies from {deps_dir}")
        
        # Clean up
        shutil.rmtree(deps_dir)
        
        print(f"✅ Simplified deployment package created: {zip_filename}")
        return zip_filename
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return None

def update_lambda_function(zip_filename):
    """Update Lambda function with simplified package"""
    print("🚀 Updating Lambda function with simplified version...")
    
    try:
        lambda_client = boto3.client('lambda')
        
        # Read zip file
        with open(zip_filename, 'rb') as f:
            zip_content = f.read()
        
        print(f"📦 Package size: {len(zip_content) / 1024 / 1024:.2f} MB")
        
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
    print("🔧 Deploying simplified CookieLens Lambda function...")
    
    # Create deployment package
    zip_filename = create_simple_deployment_package()
    if not zip_filename:
        print("❌ Failed to create deployment package")
        return
    
    # Update Lambda function
    success = update_lambda_function(zip_filename)
    if success:
        print("\n✅ Lambda function updated successfully!")
        print("🧪 You can now test the simplified function.")
        print("\n📋 Note: This simplified version:")
        print("  - Uses HTTP requests instead of browser automation")
        print("  - Can extract cookies from HTTP headers")
        print("  - Can detect third-party domains from HTML content")
        print("  - Cannot access localStorage or JavaScript-generated content")
        print("  - May miss dynamically loaded third-party services")
    else:
        print("\n❌ Failed to update Lambda function")
    
    # Clean up
    if os.path.exists(zip_filename):
        os.remove(zip_filename)
        print("🧹 Cleaned up deployment package")

if __name__ == "__main__":
    main()
