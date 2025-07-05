"use client";
import React, {
  useEffect,
  useRef,
  FormEvent,
  ChangeEvent,
  useState,
} from "react";
import Image from "next/image";
import { myAppHook } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProductType {
  id?: number;
  title: string;
  description?: string;
  cost?: number;
  file?: string;
  banner_image?: File | string | null;
}

const Dashboard: React.FC = () => {
  const { authToken, isLoading } = myAppHook();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductType>({
    title: "",
    description: "",
    cost: 0,
    file: "",
    banner_image: null,
  });
  //Page Load when authToken is available
  useEffect(() => {
    if (!authToken) {
      router.push("/auth");
      return;
    }
    fetchAllProducts();
  }, [authToken]);

  //On change form
  const handleOnChangeEvent = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setFormData({
        ...formData,
        file: URL.createObjectURL(file),
        banner_image: file,
      });
    } else {
      setFormData({
        ...formData,
        [event.target.name]: event.target.value,
      });
    }
  };
  //form submit
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description || "");
      form.append("cost", String(formData.cost ?? 0));

      if (formData.banner_image instanceof File) {
        form.append("banner_image", formData.banner_image);
      }

      if (isEdit && formData.id) {
        form.append("_method", "PUT");

        const response = await axios.post(
          `${API_URL}/products/${formData.id}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success(response.data.message);
      } else {
        const response = await axios.post(`${API_URL}/products`, form, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.status) {
          toast.success(response.data.message);
          setFormData({
            title: "",
            description: "",
            cost: 0,
            file: "",
            banner_image: null,
          });
          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }
      }

      fetchAllProducts();
      setIsEdit(false);
    } catch (error) {
      console.log("Error submitting form:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setProducts(response.data.products);
      console.log("Products fetched successfully:", response.data.products);
    } catch (error) {
      console.log("Error fetching products:", error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
     Swal.fire({
  title: "Are you sure?",
  text: "You won't be able to revert this!",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#3085d6",
  cancelButtonColor: "#d33",
  confirmButtonText: "Yes, delete it!"
}).then(async(result) => {
  if (result.isConfirmed) {
    try{
      const response =  await axios.delete(`${API_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (response.data.status) {
        // toast.success(response.data.message);
        Swal.fire({
      title: "Deleted!",
      text: "Your file has been deleted.",
      icon: "success"
    });
        fetchAllProducts();
      }
    }catch(error){
      console.error("Error deleting product:", error);
    }
    
  }
});
  }
  return (
    <>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-6">
            <div className="card p-4">
              <h4>{isEdit ? "Edit" : "Add"} Product</h4>
              <form onSubmit={handleFormSubmit}>
                <input
                  className="form-control mb-2"
                  name="title"
                  placeholder="Title"
                  value={formData.title}
                  onChange={handleOnChangeEvent}
                  required
                />
                <input
                  className="form-control mb-2"
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleOnChangeEvent}
                  required
                />
                <input
                  className="form-control mb-2"
                  name="cost"
                  placeholder="Cost"
                  value={formData.cost}
                  type="number"
                  onChange={handleOnChangeEvent}
                  required
                />
                <div className="mb-2">
                  {formData.file && (
                    <Image
                      src={formData.file}
                      alt="Preview"
                      id="bannerPreview"
                      width={100}
                      height={100}
                      style={{ display: "none" }}
                    />
                  )}
                </div>
                <input
                  className="form-control mb-2"
                  type="file"
                  ref={fileRef}
                  onChange={handleOnChangeEvent}
                  id="bannerInput"
                />
                <button className="btn btn-primary" type="submit">
                  {isEdit ? "Update" : "Add"} Product
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-6">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Banner</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((singleProduct, index) => (
                  <tr key={singleProduct.id || index}>
                    <td>{singleProduct.id}</td>
                    <td>{singleProduct.title}</td>
                    <td>
                      {singleProduct.banner_image ? (
                        <Image
                          src={
                            typeof singleProduct.banner_image === "string"
                              ? singleProduct.banner_image
                              : ""
                          }
                          alt="Product"
                          width={50}
                          height={50}
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>

                    <td>{singleProduct.cost}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => {
                          setFormData({
                            id: singleProduct.id,
                            title: singleProduct.title,
                            description: singleProduct.description,
                            cost: singleProduct.cost,
                            file: "", // no preview
                            banner_image: singleProduct.banner_image, // this is a string
                          });
                          setIsEdit(true);
                          if (fileRef.current) { fileRef.current.value = ""; }
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={ () => handleDeleteProduct(singleProduct.id!)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
