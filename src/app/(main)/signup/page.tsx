/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the accounts user story
* from the assignment.
*/

"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {useAuth} from "@/contexts/AuthContext"; // Adjust the import path as necessary

interface SignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

const SignUpPage = () => {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>();

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const onSubmit = async (data: SignUpForm) => {
    setMessage(null); // Clear previous messages
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign up");
      }

      setMessage({ type: "success", text: "User signed up successfully!" });
      // Automatically log in the user
        const loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email, password: data.password }),
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok) {
            throw new Error(loginResult.error || "Failed to log in");
        }
        
        login(loginResult.accessToken, loginResult.refreshToken);

        router.push('/');
        // window.location.href = '/';

    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Something went wrong. Please try again later." });
    }
  };

  return (
    <div className="flex justify-center items-center flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-900">Sign Up</h1>
        <p className="text-gray-600 text-center mb-6">Create a new account</p>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 mb-4 text-sm text-white rounded-md ${
              message.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              {...register("firstName", { required: "First name is required" })}
              type="text"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 text-black"
            />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              {...register("lastName", { required: "Last name is required" })}
              type="text"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 text-black"
            />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Invalid email address" },
              })}
              type="email"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 text-black"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              {...register("phoneNumber", {
                required: "Phone number is required",
                pattern: { value: /^[0-9]+$/, message: "Invalid phone number" },
              })}
              type="text"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 text-black"
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              type="password"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 text-black"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
