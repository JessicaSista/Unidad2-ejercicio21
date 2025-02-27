async function registerUser(req, res) {
  try {
    const form = formidable({
      multiples: false, // Solo un archivo
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al procesar los archivos", details: err.message });
      }

      try {
        // Verifica que el archivo 'profilePic' exista
        if (files.profilePic && files.profilePic.filepath) {
          const file = files.profilePic;
          const ext = path.extname(file.filepath);
          const newFileName = `image_${Date.now()}${ext}`;

          // Subir el archivo a Supabase
          const { data, error } = await supabase.storage
            .from("profilepics") // Asegúrate de que el nombre del bucket sea correcto
            .upload(newFileName, fs.createReadStream(file.filepath), {
              cacheControl: "3600",
              upsert: false,
              contentType: file.mimetype,
              duplex: "half",
            });

          // Check if there was an error during the upload
          if (error) {
            throw new Error(`Error al subir archivo: ${error.message}`);
          }

          // Ensure 'data' contains the required information (e.g., file URL)
          const fileUrl = data?.Key
            ? `${process.env.SUPABASE_URL}/storage/v1/object/public/profilepics/${data.Key}`
            : null;

          if (!fileUrl) {
            return res.status(500).json({ error: "No se pudo obtener la URL de la imagen." });
          }

          // Add the file URL to the user's data (in case you want to store it in the DB)
          fields.profilePicUrl = fileUrl;

          // Crear el nuevo usuario en la base de datos
          const newUser = await userController.store(fields, files);
          res.status(201).json({ message: "Usuario registrado correctamente" });
        } else {
          res.status(400).json({ error: "No se encontró el archivo de imagen" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al registrar usuario", details: error.message });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor", details: error.message });
  }
}
