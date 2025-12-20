import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import FollowingList from '@/components/FollowingList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Following: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-4">Invalid user ID.</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        {/* Following List */}
        <FollowingList userId={id} />
      </div>
    </div>
  );
};

export default Following;

