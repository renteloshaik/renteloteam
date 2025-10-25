import yogaImage from "../assests/yoga.png";

export default function PendingDrops() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Pending Drops Page
        </h1>
        <p className="text-gray-600 mb-6">
          This page is currently under development.
        </p>
        <div className="flex justify-center mb-6">
          <img
            src={yogaImage}
            alt="Yoga illustration"
            className="h-32 w-32 object-contain animate-pulse"
          />
        </div>
        <p className="text-gray-700 font-medium">
          We are working hard to bring this feature to you.
        </p>
        <p className="text-gray-500 mt-2">
          Very soon you will get the updated page. Thank you for your patience!
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
